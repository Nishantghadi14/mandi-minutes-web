Add-Type -AssemblyName System.Drawing

$productsDir = Join-Path $PSScriptRoot "..\public\products"
$files = Get-ChildItem -Path (Join-Path $productsDir "*") -Include *.jpg,*.jpeg,*.png -File

$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)

$totalSaved = 0
$totalInitial = 0
$totalFinal = 0

foreach ($file in $files) {
    $initialSize = $file.Length
    $totalInitial += $initialSize

    # Load image from stream so file is not locked
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $ms = New-Object System.IO.MemoryStream(,$bytes)
    $img = [System.Drawing.Image]::FromStream($ms)

    $maxDim = 600
    $width = $img.Width
    $height = $img.Height

    if ($width -gt $maxDim -or $height -gt $maxDim) {
        if ($width -gt $height) {
            $newWidth = $maxDim
            $newHeight = [int]($height * ($maxDim / $width))
        } else {
            $newHeight = $maxDim
            $newWidth = [int]($width * ($maxDim / $height))
        }
    } else {
        $newWidth = $width
        $newHeight = $height
    }

    $bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)

    $tempPath = "$($file.FullName).tmp"
    if ($file.Extension -eq ".png") {
        $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } else {
        $bmp.Save($tempPath, $jpegEncoder, $encoderParams)
    }

    $graphics.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    $ms.Dispose()

    $newSize = (Get-Item $tempPath).Length

    # Only replace if smaller
    if ($newSize -lt $initialSize) {
        Move-Item -Path $tempPath -Destination $file.FullName -Force
        $saved = $initialSize - $newSize
        $totalSaved += $saved
        $totalFinal += $newSize
        Write-Output ("Optimized: {0} ({1:N0} KB -> {2:N0} KB, -{3:N0}%)" -f $file.Name, ($initialSize / 1KB), ($newSize / 1KB), (($saved / $initialSize) * 100))
    } else {
        Remove-Item -Path $tempPath -Force
        $totalFinal += $initialSize
        Write-Output ("Skipped: {0} (already optimal)" -f $file.Name)
    }
}

Write-Output ("----------------------------------------")
Write-Output ("Total Before: {0:N2} MB" -f ($totalInitial / 1MB))
Write-Output ("Total After:  {0:N2} MB" -f ($totalFinal / 1MB))
Write-Output ("Total Saved:  {0:N2} MB ({1:N1}%)" -f ($totalSaved / 1MB), (($totalSaved / $totalInitial) * 100))
