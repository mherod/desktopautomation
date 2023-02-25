set myOutput to {}
set i to 0
try
  tell application "System Events"
    set myProcesses to (processes whose background only = false)
    set p to 0
    repeat with myProcess in myProcesses
      set p to p + 1
      set w to 0
      repeat with myWindow in (windows of myProcess)
        set w to w + 1
        try
          set myProcessName to name of myProcess
          set myWindowName to name of myWindow
          set myWindowSize to size of myWindow
          set myWindowPosition to position of myWindow
          set i to i + 1
          set myOutput to {myOutput & "\n" & {"i=" & i}, {"p=" & p}, {"w=" & w}, {{"processName=" & myProcessName}, {"windowName=" & myWindowName}, {"windowSize=", {myWindowSize}}, {"windowPosition=", {myWindowPosition}}}}
        end try
      end repeat
    end repeat
  end tell
on error errStr number errNum
end try
copy myOutput to stdout
