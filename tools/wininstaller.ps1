if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) { Start-Process powershell.exe "-noexit -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs; exit }

# Your script here
get-ciminstance win32_service -filter "name='dotuptest'" | remove-ciminstance
new-service -Name "dotuptest" -DisplayName "dotuptest" -Description "dotuptest" -BinaryPathName "NODE C:\temp\yo-test\motolaps-device-discovery-service\dist\app.js" -StartupType Automatic