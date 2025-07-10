Set objShell = CreateObject("WScript.Shell")
Set objArgs = WScript.Arguments

If objArgs.Count < 1 Then
    WScript.Echo "Usage: regedit.vbs <command> [parameters]"
    WScript.Quit 1
End If

command = objArgs(0)

Select Case command
    Case "read"
        If objArgs.Count < 2 Then
            WScript.Echo "Usage: regedit.vbs read <key>"
            WScript.Quit 1
        End If
        key = objArgs(1)
        On Error Resume Next
        value = objShell.RegRead(key)
        If Err.Number <> 0 Then
            WScript.Echo "Error reading registry key: " & Err.Description
            WScript.Quit 1
        End If
        WScript.Echo value
        On Error GoTo 0
    Case "write"
        If objArgs.Count < 4 Then
            WScript.Echo "Usage: regedit.vbs write <key> <type> <value>"
            WScript.Quit 1
        End If
        key = objArgs(1)
        regtype = objArgs(2)
        value = objArgs(3)
        
        ' 转换注册表路径格式
        If Left(key, 5) = "HKCU\" Then
            key = "HKEY_CURRENT_USER\" & Mid(key, 6)
        ElseIf Left(key, 4) = "HKLM\" Then
            key = "HKEY_LOCAL_MACHINE\" & Mid(key, 5)
        ElseIf Left(key, 4) = "HKCR\" Then
            key = "HKEY_CLASSES_ROOT\" & Mid(key, 5)
        ElseIf Left(key, 4) = "HKU\" Then
            key = "HKEY_USERS\" & Mid(key, 4)
        End If
        
        On Error Resume Next
        objShell.RegWrite key, value, regtype
        If Err.Number <> 0 Then
            WScript.Echo "Error writing registry key: " & Err.Description
            WScript.Quit 1
        End If
        WScript.Echo "Successfully wrote to registry"
        On Error GoTo 0
    Case "delete"
        If objArgs.Count < 2 Then
            WScript.Echo "Usage: regedit.vbs delete <key>"
            WScript.Quit 1
        End If
        key = objArgs(1)
        
        ' 转换注册表路径格式
        If Left(key, 5) = "HKCU\" Then
            key = "HKEY_CURRENT_USER\" & Mid(key, 6)
        ElseIf Left(key, 4) = "HKLM\" Then
            key = "HKEY_LOCAL_MACHINE\" & Mid(key, 5)
        ElseIf Left(key, 4) = "HKCR\" Then
            key = "HKEY_CLASSES_ROOT\" & Mid(key, 5)
        ElseIf Left(key, 4) = "HKU\" Then
            key = "HKEY_USERS\" & Mid(key, 4)
        End If
        
        On Error Resume Next
        objShell.RegDelete key
        If Err.Number <> 0 Then
            WScript.Echo "Error deleting registry key: " & Err.Description
            WScript.Quit 1
        End If
        WScript.Echo "Successfully deleted registry key"
        On Error GoTo 0
    Case Else
        WScript.Echo "Unknown command: " & command
        WScript.Echo "Available commands: read, write, delete"
        WScript.Quit 1
End Select