' ==============================================================================
' GPR Offset Printers — Windows File Explorer Protocol Handler
' Handles "gpr-explorer://select?path=..." URLs from local and cloud web apps.
' Spawns explorer.exe with the exact saved file auto-selected.
' ==============================================================================
Option Explicit

On Error Resume Next

If WScript.Arguments.Count = 0 Then
    WScript.Quit 1
End If

Dim rawArg, targetPath
rawArg = WScript.Arguments(0)

' Extract path from URL query: gpr-explorer://select?path=<encoded_path>
Dim qPos, ampPos
qPos = InStr(1, rawArg, "path=", 1)
If qPos > 0 Then
    targetPath = Mid(rawArg, qPos + 5)
    ampPos = InStr(1, targetPath, "&")
    If ampPos > 0 Then
        targetPath = Left(targetPath, ampPos - 1)
    End If
Else
    ' Direct scheme without query param: gpr-explorer://<path> or gpr-explorer:<path>
    targetPath = rawArg
    If LCase(Left(targetPath, 15)) = "gpr-explorer://" Then
        targetPath = Mid(targetPath, 16)
    ElseIf LCase(Left(targetPath, 13)) = "gpr-explorer:" Then
        targetPath = Mid(targetPath, 14)
    End If
End If

' Decode URL-encoded characters (e.g. %20 -> space, %5C -> \)
Function URLDecode(s)
    Dim res, i, ch, hexVal
    res = ""
    i = 1
    Do While i <= Len(s)
        ch = Mid(s, i, 1)
        If ch = "+" Then
            res = res & " "
            i = i + 1
        ElseIf ch = "%" And i + 2 <= Len(s) Then
            hexVal = Mid(s, i + 1, 2)
            On Error Resume Next
            res = res & Chr(CInt("&H" & hexVal))
            If Err.Number <> 0 Then
                res = res & "%" & hexVal
                Err.Clear
            End If
            On Error Goto 0
            i = i + 3
        Else
            res = res & ch
            i = i + 1
        End If
    Loop
    URLDecode = res
End Function

targetPath = URLDecode(targetPath)
targetPath = Replace(targetPath, "/", "\")
targetPath = Trim(targetPath)

' Strip wrapping quotes if passed
If Left(targetPath, 1) = """" And Right(targetPath, 1) = """" Then
    targetPath = Mid(targetPath, 2, Len(targetPath) - 2)
End If

Dim fso, wsh
Set fso = CreateObject("Scripting.FileSystemObject")
Set wsh = CreateObject("WScript.Shell")

Dim resolvedPath
resolvedPath = ""

' Check if targetPath is already a valid absolute path
If fso.FileExists(targetPath) Then
    resolvedPath = targetPath
ElseIf fso.FolderExists(targetPath) Then
    resolvedPath = targetPath
Else
    ' Resolve relative path against standard Windows user directories
    Dim userProfile, fileNameOnly
    userProfile = wsh.ExpandEnvironmentStrings("%USERPROFILE%")
    fileNameOnly = fso.GetFileName(targetPath)

    Dim candidatePaths(10)
    candidatePaths(0) = fso.BuildPath(userProfile, "Documents\" & targetPath)
    candidatePaths(1) = fso.BuildPath(userProfile, "Documents\gpr\" & targetPath)
    candidatePaths(2) = fso.BuildPath(userProfile, "Documents\gpr\pdf\" & fileNameOnly)
    candidatePaths(3) = fso.BuildPath(userProfile, "Documents\gpr\jpg\" & fileNameOnly)
    candidatePaths(4) = fso.BuildPath(userProfile, "Documents\gpr\accounts\" & fileNameOnly)
    candidatePaths(5) = fso.BuildPath(userProfile, "Downloads\" & targetPath)
    candidatePaths(6) = fso.BuildPath(userProfile, "Downloads\" & fileNameOnly)
    candidatePaths(7) = fso.BuildPath(userProfile, "Desktop\" & targetPath)
    candidatePaths(8) = "C:\" & targetPath
    candidatePaths(9) = "C:\gpr\" & targetPath
    candidatePaths(10) = "D:\" & targetPath

    Dim idx
    For idx = 0 To UBound(candidatePaths)
        If candidatePaths(idx) <> "" Then
            If fso.FileExists(candidatePaths(idx)) Then
                resolvedPath = candidatePaths(idx)
                Exit For
            End If
        End If
    Next

    ' If file not found, check if parent folder exists
    If resolvedPath = "" Then
        For idx = 0 To UBound(candidatePaths)
            If candidatePaths(idx) <> "" Then
                Dim parentFolder
                parentFolder = fso.GetParentFolderName(candidatePaths(idx))
                If fso.FolderExists(parentFolder) Then
                    resolvedPath = parentFolder
                    Exit For
                End If
            End If
        Next
    End If
End If

' Launch explorer.exe with the resolved path
If resolvedPath <> "" Then
    If fso.FileExists(resolvedPath) Then
        ' Select the specific file in Windows Explorer
        wsh.Run "explorer.exe /select,""" & resolvedPath & """", 1, False
    Else
        ' Open folder
        wsh.Run "explorer.exe """ & resolvedPath & """", 1, False
    End If
Else
    ' Fallback to opening Documents or user profile
    Dim defaultDocs
    defaultDocs = wsh.ExpandEnvironmentStrings("%USERPROFILE%\Documents")
    If fso.FolderExists(defaultDocs & "\gpr") Then
        wsh.Run "explorer.exe """ & defaultDocs & "\gpr""", 1, False
    Else
        wsh.Run "explorer.exe """ & defaultDocs & """", 1, False
    End If
End If
