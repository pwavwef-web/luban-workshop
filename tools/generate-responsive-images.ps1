Add-Type -AssemblyName System.Drawing

function Save-JpegVariant {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Target,
        [Parameter(Mandatory = $true)][int]$TargetWidth,
        [int]$Quality = 82
    )

    $sourcePath = (Resolve-Path -LiteralPath $Source).Path
    $targetPath = Join-Path (Get-Location) $Target
    $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

    try {
        $ratio = $TargetWidth / [double]$sourceImage.Width
        $targetHeight = [Math]::Max(1, [int][Math]::Round($sourceImage.Height * $ratio))
        $bitmap = New-Object System.Drawing.Bitmap $TargetWidth, $targetHeight

        try {
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.DrawImage($sourceImage, 0, 0, $TargetWidth, $targetHeight)
            } finally {
                $graphics.Dispose()
            }

            $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
            $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
            $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([int64]$Quality)
            $bitmap.Save($targetPath, $encoder, $encoderParams)
        } finally {
            if ($bitmap) { $bitmap.Dispose() }
        }
    } finally {
        $sourceImage.Dispose()
    }
}

Save-JpegVariant -Source 'restcon.png' -Target 'assets/restcon-768.jpg' -TargetWidth 768 -Quality 78
Save-JpegVariant -Source 'restcon.png' -Target 'assets/restcon-1280.jpg' -TargetWidth 1280 -Quality 80
Save-JpegVariant -Source 'restcon.png' -Target 'assets/restcon-1920.jpg' -TargetWidth 1920 -Quality 82
Save-JpegVariant -Source 'assets/luban-noodle-spread.jpg' -Target 'assets/luban-noodle-spread-480.jpg' -TargetWidth 480 -Quality 82
