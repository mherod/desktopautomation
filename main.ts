import screenshot from "screenshot-desktop";
import fs from "fs";
import path from "path";
import readline from "readline";
import consola from "consola";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { google } from "@google-cloud/vision/build/protos/protos";
import robot from "robotjs";
import sharp from "sharp";
import { queryOpenWindows } from "./queryOpenWindows";
import Tesseract, { Bbox, createWorker, OEM, PSM, RecognizeResult } from "tesseract.js";
import { waitMillis } from "./waitMillis";

function recognize(imageLike: Buffer): Promise<RecognizeResult> {
  return new Promise(async (resolve) => {
    const workerPromise = createWorker({
      logger: consola.debug
    });
    const worker = await workerPromise;
    await worker.loadLanguage("eng+osd");
    await worker.initialize("eng+osd");
    await worker.setParameters({
      tessedit_ocr_engine_mode: OEM.TESSERACT_LSTM_COMBINED,
      tessedit_pageseg_mode: PSM.AUTO
    });
    const recogniseResult = await worker.recognize(imageLike, {});
    resolve(recogniseResult);
    await worker.terminate();
  });
}

const visionClient: ImageAnnotatorClient = new ImageAnnotatorClient({
  credentials: require("./serviceAccountKey.json")
});

export async function annotateImage(content: Buffer): Promise<[google.cloud.vision.v1.IAnnotateImageResponse]> {
  return visionClient.annotateImage({
    image: {
      content: content.toString("base64")
    },
    features: [
      {
        type: "LABEL_DETECTION",
        maxResults: 10
      },
      {
        type: "WEB_DETECTION",
        maxResults: 10
      }
    ]
  });
}

interface ClickFromResultParams {
  recognizeResult: Tesseract.RecognizeResult;
  searchString: string | RegExp;
  leftOffset: number;
  topOffset: number;
  scale: number;
}

async function clickFromResult(
  //
  {
    recognizeResult,
    searchString,
    leftOffset = 0,
    topOffset = 0,
    scale = 1
//
  }: ClickFromResultParams) {
  for (const block of recognizeResult.data.blocks) {
    if (!block.text.match(searchString)) {
      // consola.warn("Skipping", block.text);
      continue;
    }
    const trim = block.text.trim();
    const bbox: Bbox = block.bbox;
    consola.success("Found", trim, bbox);
    let x = (bbox.x0 + bbox.x1) / 2;
    let y = (bbox.y0 + bbox.y1) / 2;
    const rx = (leftOffset + x) / scale;
    const ry = (topOffset + y) / scale;
    robot.moveMouseSmooth(
      rx,
      ry - 100
    );
    await waitMillis(800);
    robot.mouseClick();
    await waitMillis(800);
    robot.moveMouseSmooth(
      rx,
      ry
    );
    await waitMillis(800);
    robot.mouseClick();
    robot.moveMouseSmooth(
      rx,
      ry + 80
    );
    await waitMillis(800);
    robot.mouseClick();
  }
}

async function screenshotOpenWindows() {
  try {
    consola.start("Querying for open desktop windows");
    const desktopPromise = queryOpenWindows();
    const screenshotPromise = screenshot();
    const processes = await desktopPromise;
    consola.success("Found", processes.length, "open desktop windows");
    consola.start("Taking screenshot");
    const capture: Buffer = await screenshotPromise;
    consola.success("Screenshot taken");
    const screenSize = robot.getScreenSize();
    const screenWidth = screenSize.width;
    const sharp1 = sharp(capture);
    const meta = await sharp1.metadata();
    const { width: screenshotWidth } = meta;
    const scale = screenshotWidth / screenWidth;
    consola.info("Screenshot scale", scale);
    for (const process of processes) {
      if (process.processName != "Google Chrome") {
        consola.info("Skipping", process.processName);
        continue;
      }
      for (const window of process.windows) {
        const title = window.windowName;
        const [x, y] = window.windowPosition;
        const [width, height] = window.windowSize;
        consola.start("Cropping", title);
        const left = Number(x) * scale;
        const top = Number(y) * scale;
        const cropWidth = Number(width) * scale;
        const cropHeight = Number(height) * scale;
        if (
          Number.isNaN(cropWidth) ||
          Number.isNaN(cropHeight) ||
          Number.isNaN(left) ||
          Number.isNaN(top) ||
          cropHeight < 10 ||
          cropWidth < 10 ||
          left < 0 ||
          top < 0 ||
          left > screenshotWidth ||
          top > screenshotWidth
          //
        ) {
          consola.warn("Skipping", title);
          continue;
        }
        const cropped = await sharp1
          .clone()
          .extract({
            left: left,
            top: top,
            width: cropWidth,
            height: cropHeight
            //
          })
          .toBuffer();
        consola.success("Cropped", title);
        const folder = path.join(__dirname, "screenshots", process.processName);
        if (!fs.existsSync(folder)) {
          consola.info("Creating folder", folder);
          fs.mkdirSync(folder, { recursive: true });
        }
        const filename = title //
          .replace(/[^a-z0-9]+/gi, "_") //
          .toLowerCase() //
          .slice(0, 50); //
        const outImg = path.join(folder, `${filename}.png`);
        const outJson = path.join(folder, `${filename}.json`);
        consola.start("Writing", outImg);
        const croppedData = await cropped;
        consola.start("Recognizing", outImg);
        const recognizeResult = await recognize(croppedData);
        await clickFromResult({
          recognizeResult: recognizeResult,
          leftOffset: left,
          topOffset: top,
          scale: scale,
          searchString: /not a robot\s+$/
        });
        consola.success("Recognized", outImg);
        fs.writeFileSync(outImg, croppedData);
        fs.writeFileSync(
          outJson,
          JSON.stringify(recognizeResult.data.blocks, null, 2),
          "utf-8"
          //
        );
        consola.success("Wrote", outImg);
      }
    }

    // const annotations = await annotateImage(img);
    // fs.writeFileSync("screenshot.png", img);
    // fs.writeFileSync("annotations.json", JSON.stringify(annotations, null, 2));
    // consola.info(annotations);
  } catch (err1) {
    consola.error(err1);
  }
}

interface Input {
  question: string;
  example?: string;
  orDefault?: string;
}

async function readInput(
  {
    question,
    example = "",
    orDefault = ""
    //
  }: Input
  //
): Promise<string> {
  return new Promise((resolve) => {
    const cli = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const prompt = [
      question?.trim(),
      example ? `(e.g. ${example})` : null,
      orDefault ? `(default: ${orDefault})` : null
    ]
      .filter(Boolean)
      .join(" ");
    cli.question(prompt + ": ", (answer: string) => {
      if (!answer) {
        resolve(orDefault);
      } else {
        resolve(answer);
      }
      cli.close();
    });
  });
}

async function main() {
  consola.start("Starting");
  while (true) {
    await screenshotOpenWindows();
    await waitMillis(1000);
  }
  consola.success("Done");
}

main().catch(consola.error);
