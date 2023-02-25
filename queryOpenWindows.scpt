set myOutput to {}
set i to 0
try
  tell application "System Events"
    set myProcesses to (processes whose background only = false)
    set p to 0
    repeat with myProcess in myProcesses
      set p to p + 1
      set pid to id of myProcess
      set myProcessName to ""
      try -- some processes don't have a name
        set myProcessName to name of myProcess
      end try
      set w to 0
      repeat with myWindow in (windows of myProcess)
        set w to w + 1
        try
          set myWindowName to ""
          try -- some windows don't have a name
            set myWindowName to name of myWindow
          end try
          set myWindowSize to ""
          try -- some windows don't have a size
            set myWindowSize to size of myWindow
          end try
          set myWindowPosition to ""
          try -- some windows don't have a position
            set myWindowPosition to position of myWindow
          end try
          set i to i + 1
          set myOutput to {myOutput & "\n" & {"i=" & i}, {"p=" & p}, {"w=" & w}, {{"pID=" & pid}, {"processName=" & myProcessName}, {"windowName=" & myWindowName}, {"windowSize=", {myWindowSize}}, {"windowPosition=", {myWindowPosition}}}}
        end try
      end repeat
    end repeat
  end tell
on error errStr number errNum
  set myOutput to {myOutput & "\n" & {"error=" & errStr & " (" & errNum & ")"}}
end try
copy myOutput to stdout
