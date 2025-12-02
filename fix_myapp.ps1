# Read the file
$file = 'c:\projects\donor\src\pages\MyApplication.jsx'
$lines = Get-Content $file

# Find the line number that has "Submit Application"
$submitIdx = $null
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'Submit Application') {
        $submitIdx = $i
        break
    }
}

if ($submitIdx -eq $null) {
    Write-Host "Could not find 'Submit Application' in file"
    exit
}

Write-Host "Found 'Submit Application' at line $($submitIdx + 1)"

# Find where the Card closes (look for </Card> pattern)
$cardCloseIdx = $null
for ($i = $submitIdx; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s+</Card>' -and $cardCloseIdx -eq $null) {
        $cardCloseIdx = $i
        break
    }
}

Write-Host "Found closing Card tag at line $($cardCloseIdx + 1)"

# Show what we're replacing
Write-Host "`nFirst few lines of section:"
$lines[$submitIdx..($submitIdx+3)] | ForEach-Object { Write-Host "  $_" }
Write-Host "`nLast few lines of section:"
$lines[($cardCloseIdx-2)..$cardCloseIdx] | ForEach-Object { Write-Host "  $_" }

Write-Host "`n... (will replace lines $(($submitIdx - 1) + 1) to $(($cardCloseIdx) + 1))"
