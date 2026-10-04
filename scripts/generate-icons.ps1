Add-Type -AssemblyName System.Drawing

function Generate-MandiIcon([int]$size, [string]$outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#121212"))
    $cornerRad = [int]($size * 0.22)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)

    # Draw rounded rectangle
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $cornerRad * 2
    $path.AddArc(0, 0, $diameter, $diameter, 180, 90)
    $path.AddArc($size - $diameter, 0, $diameter, $diameter, 270, 90)
    $path.AddArc($size - $diameter, $size - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc(0, $size - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    $g.FillPath($bgBrush, $path)

    # Lightning Bolt Points mapped to canvas size
    # Original: M288 48L136 280h120l-36 184 196-252H284z (on 512x512)
    $scale = $size / 512.0
    $pts = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF -ArgumentList ([float](288 * $scale)), ([float](48 * $scale))),
        (New-Object System.Drawing.PointF -ArgumentList ([float](136 * $scale)), ([float](280 * $scale))),
        (New-Object System.Drawing.PointF -ArgumentList ([float](256 * $scale)), ([float](280 * $scale))),
        (New-Object System.Drawing.PointF -ArgumentList ([float](220 * $scale)), ([float](464 * $scale))),
        (New-Object System.Drawing.PointF -ArgumentList ([float](416 * $scale)), ([float](212 * $scale))),
        (New-Object System.Drawing.PointF -ArgumentList ([float](284 * $scale)), ([float](212 * $scale)))
    )

    $boltBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($size, $size)),
        [System.Drawing.ColorTranslator]::FromHtml("#00C851"),
        [System.Drawing.ColorTranslator]::FromHtml("#00E65C")
    )
    $g.FillPolygon($boltBrush, $pts)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $path.Dispose()
    $bgBrush.Dispose()
    $boltBrush.Dispose()
    $bmp.Dispose()
    Write-Output "Generated icon: $outputPath ($size x $size)"
}

$publicDir = Join-Path $PSScriptRoot "..\public"
Generate-MandiIcon 192 (Join-Path $publicDir "icon-192.png")
Generate-MandiIcon 512 (Join-Path $publicDir "icon-512.png")
Generate-MandiIcon 64 (Join-Path $publicDir "favicon.png")
