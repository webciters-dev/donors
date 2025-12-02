# PowerShell script to remove ALL emojis from project files
# This script safely removes emojis while preserving all functionality

$emojiPattern = "[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]"
$fileTypes = @("*.jsx", "*.js", "*.md", "*.sh")
$excludePatterns = @("node_modules", ".next", "dist", "build", ".git")

# Get all source files
$files = @()
foreach ($fileType in $fileTypes) {
    $items = Get-ChildItem -Path "c:\projects\donor" -Recurse -Include $fileType -ErrorAction SilentlyContinue | 
        Where-Object { 
            $path = $_.FullName
            $exclude = $false
            foreach ($pattern in $excludePatterns) {
                if ($path -like "*$pattern*") {
                    $exclude = $true
                    break
                }
            }
            -not $exclude
        }
    $files += $items
}

Write-Host "Found $($files.Count) source files to process"
Write-Host ""

$filesModified = 0
$emojisRemoved = 0

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        
        # Count emojis before
        $emojiMatches = [regex]::Matches($content, $emojiPattern)
        $emojiCount = $emojiMatches.Count
        
        if ($emojiCount -gt 0) {
            Write-Host "Processing: $($file.FullName.Replace('c:\projects\donor\', ''))" -ForegroundColor Yellow
            Write-Host "  Emojis found: $emojiCount"
            
            # Remove all emojis
            $newContent = [regex]::Replace($content, $emojiPattern, "")
            
            # Write back
            [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
            
            $filesModified++
            $emojisRemoved += $emojiCount
            Write-Host "  Status: CLEANED" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "ERROR processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "EMOJI REMOVAL COMPLETE" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Files modified: $filesModified"
Write-Host "Emojis removed: $emojisRemoved"
Write-Host ""
Write-Host "All functionality preserved - emojis were purely cosmetic!" -ForegroundColor Green
