$mediaRoot=[System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\public\review-drop\media"));$expectedRoot="C:\Users\xxxye\Documents\Codex\2026-08-09\files-mentioned-by-the-user-13thoni\public\review-drop\media"
if($mediaRoot -ne $expectedRoot){throw "Unexpected review workspace: $mediaRoot"}
if(Test-Path -LiteralPath $mediaRoot){Get-ChildItem -LiteralPath $mediaRoot -Force|Where-Object{$_.Name -ne ".gitkeep"}|Remove-Item -Force -Recurse}
& (Join-Path $PSScriptRoot "Update-13OniReviewManifest.ps1")
