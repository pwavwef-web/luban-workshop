param(
    [string]$SiteUrl = "https://lubanrestaurant.com"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$Root = Split-Path -Parent $PSScriptRoot
$CampaignDir = Join-Path $Root "assets\election-campaign"
$QrDir = Join-Path $Root "assets\qr-codes"
New-Item -ItemType Directory -Force -Path $CampaignDir, $QrDir | Out-Null

function Color-Hex {
    param([string]$Hex, [int]$Alpha = 255)
    $clean = $Hex.TrimStart("#")
    if ($clean.Length -eq 3) {
        $clean = -join ($clean.ToCharArray() | ForEach-Object { "$_$_" })
    }
    return [System.Drawing.Color]::FromArgb(
        $Alpha,
        [Convert]::ToInt32($clean.Substring(0, 2), 16),
        [Convert]::ToInt32($clean.Substring(2, 2), 16),
        [Convert]::ToInt32($clean.Substring(4, 2), 16)
    )
}

function New-Font {
    param(
        [string]$Family,
        [float]$Size,
        [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
    )
    try {
        return [System.Drawing.Font]::new($Family, $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
    }
    catch {
        return [System.Drawing.Font]::new("Arial", $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
    }
}

function New-RectF {
    param([float]$X, [float]$Y, [float]$W, [float]$H)
    return [System.Drawing.RectangleF]::new($X, $Y, $W, $H)
}

function New-RoundedPath {
    param([System.Drawing.RectangleF]$Rect, [float]$Radius)
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diameter = $Radius * 2
    $arc = [System.Drawing.RectangleF]::new($Rect.X, $Rect.Y, $diameter, $diameter)
    $path.AddArc($arc, 180, 90)
    $arc.X = $Rect.Right - $diameter
    $path.AddArc($arc, 270, 90)
    $arc.Y = $Rect.Bottom - $diameter
    $path.AddArc($arc, 0, 90)
    $arc.X = $Rect.X
    $path.AddArc($arc, 90, 90)
    $path.CloseFigure()
    return $path
}

function Fill-RoundedRect {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.Brush]$Brush,
        [System.Drawing.RectangleF]$Rect,
        [float]$Radius
    )
    $path = New-RoundedPath $Rect $Radius
    $Graphics.FillPath($Brush, $path)
    $path.Dispose()
}

function Stroke-RoundedRect {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.Pen]$Pen,
        [System.Drawing.RectangleF]$Rect,
        [float]$Radius
    )
    $path = New-RoundedPath $Rect $Radius
    $Graphics.DrawPath($Pen, $path)
    $path.Dispose()
}

function Draw-CoverImage {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Path,
        [System.Drawing.RectangleF]$Rect,
        [float]$Radius = 0,
        [float]$Opacity = 1.0
    )
    if (!(Test-Path $Path)) { return }
    $image = [System.Drawing.Image]::FromFile($Path)
    try {
        $scale = [Math]::Max($Rect.Width / $image.Width, $Rect.Height / $image.Height)
        $drawW = $image.Width * $scale
        $drawH = $image.Height * $scale
        $drawX = $Rect.X + (($Rect.Width - $drawW) / 2)
        $drawY = $Rect.Y + (($Rect.Height - $drawH) / 2)
        $dest = [System.Drawing.RectangleF]::new($drawX, $drawY, $drawW, $drawH)

        $oldClip = $Graphics.Clip
        if ($Radius -gt 0) {
            $clipPath = New-RoundedPath $Rect $Radius
            $Graphics.SetClip($clipPath)
            $clipPath.Dispose()
        }

        if ($Opacity -lt 1.0) {
            $matrix = [System.Drawing.Imaging.ColorMatrix]::new()
            $matrix.Matrix33 = $Opacity
            $attrs = [System.Drawing.Imaging.ImageAttributes]::new()
            $attrs.SetColorMatrix($matrix, [System.Drawing.Imaging.ColorMatrixFlag]::Default, [System.Drawing.Imaging.ColorAdjustType]::Bitmap)
            $destRect = [System.Drawing.Rectangle]::new([int]$dest.X, [int]$dest.Y, [int]$dest.Width, [int]$dest.Height)
            $Graphics.DrawImage($image, $destRect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
            $attrs.Dispose()
        }
        else {
            $Graphics.DrawImage($image, $dest)
        }

        $Graphics.Clip = $oldClip
        $oldClip.Dispose()
    }
    finally {
        $image.Dispose()
    }
}

function Draw-ContainedImage {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Path,
        [System.Drawing.RectangleF]$Rect,
        [float]$Opacity = 1.0
    )
    if (!(Test-Path $Path)) { return }
    $image = [System.Drawing.Image]::FromFile($Path)
    try {
        $scale = [Math]::Min($Rect.Width / $image.Width, $Rect.Height / $image.Height)
        $drawW = $image.Width * $scale
        $drawH = $image.Height * $scale
        $dest = [System.Drawing.RectangleF]::new(
            $Rect.X + (($Rect.Width - $drawW) / 2),
            $Rect.Y + (($Rect.Height - $drawH) / 2),
            $drawW,
            $drawH
        )
        if ($Opacity -lt 1.0) {
            $matrix = [System.Drawing.Imaging.ColorMatrix]::new()
            $matrix.Matrix33 = $Opacity
            $attrs = [System.Drawing.Imaging.ImageAttributes]::new()
            $attrs.SetColorMatrix($matrix, [System.Drawing.Imaging.ColorMatrixFlag]::Default, [System.Drawing.Imaging.ColorAdjustType]::Bitmap)
            $destRect = [System.Drawing.Rectangle]::new([int]$dest.X, [int]$dest.Y, [int]$dest.Width, [int]$dest.Height)
            $Graphics.DrawImage($image, $destRect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
            $attrs.Dispose()
        }
        else {
            $Graphics.DrawImage($image, $dest)
        }
    }
    finally {
        $image.Dispose()
    }
}

function Draw-FitText {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [string]$Family,
        [float]$MaxSize,
        [float]$MinSize,
        [System.Drawing.FontStyle]$Style,
        [System.Drawing.Brush]$Brush,
        [System.Drawing.RectangleF]$Rect,
        [System.Drawing.StringFormat]$Format
    )
    for ($size = $MaxSize; $size -ge $MinSize; $size -= 2) {
        $font = New-Font $Family $size $Style
        $measured = $Graphics.MeasureString($Text, $font, [System.Drawing.SizeF]::new($Rect.Width, 9999), $Format)
        if ($measured.Height -le $Rect.Height -and $measured.Width -le ($Rect.Width + 4)) {
            $Graphics.DrawString($Text, $font, $Brush, $Rect, $Format)
            $font.Dispose()
            return
        }
        $font.Dispose()
    }
    $fallback = New-Font $Family $MinSize $Style
    $Graphics.DrawString($Text, $fallback, $Brush, $Rect, $Format)
    $fallback.Dispose()
}

function Draw-Label {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [float]$X,
        [float]$Y,
        [float]$W,
        [string]$Back = "#b91c1c",
        [string]$Fore = "#ffffff"
    )
    $font = New-Font "Segoe UI" 28 ([System.Drawing.FontStyle]::Bold)
    $rect = New-RectF $X $Y $W 58
    $brush = [System.Drawing.SolidBrush]::new((Color-Hex $Back))
    Fill-RoundedRect $Graphics $brush $rect 29
    $brush.Dispose()
    $textBrush = [System.Drawing.SolidBrush]::new((Color-Hex $Fore))
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $Graphics.DrawString($Text, $font, $textBrush, $rect, $format)
    $format.Dispose()
    $textBrush.Dispose()
    $font.Dispose()
}

function Draw-CheckIcon {
    param([System.Drawing.Graphics]$Graphics, [float]$X, [float]$Y, [float]$Size, [string]$Color)
    $pen = [System.Drawing.Pen]::new((Color-Hex $Color), [Math]::Max(6, $Size / 9))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $Graphics.DrawLines($pen, @(
        [System.Drawing.PointF]::new($X + ($Size * 0.18), $Y + ($Size * 0.52)),
        [System.Drawing.PointF]::new($X + ($Size * 0.42), $Y + ($Size * 0.74)),
        [System.Drawing.PointF]::new($X + ($Size * 0.84), $Y + ($Size * 0.22))
    ))
    $pen.Dispose()
}

function Draw-BallotIcon {
    param([System.Drawing.Graphics]$Graphics, [float]$X, [float]$Y, [float]$W, [float]$H)
    $paper = [System.Drawing.SolidBrush]::new((Color-Hex "#ffffff" 235))
    $pen = [System.Drawing.Pen]::new((Color-Hex "#d9a441"), 5)
    $rect = New-RectF $X $Y $W $H
    Fill-RoundedRect $Graphics $paper $rect 18
    Stroke-RoundedRect $Graphics $pen $rect 18
    $paper.Dispose()
    $pen.Dispose()
    $linePen = [System.Drawing.Pen]::new((Color-Hex "#7c2d1f" 170), 5)
    $Graphics.DrawLine($linePen, $X + 34, $Y + 42, $X + $W - 34, $Y + 42)
    $Graphics.DrawLine($linePen, $X + 34, $Y + 82, $X + $W - 68, $Y + 82)
    $linePen.Dispose()
    Draw-CheckIcon $Graphics ($X + $W - 94) ($Y + $H - 86) 62 "#b91c1c"
}

function Get-QrMatrix {
    param([string]$Text)
    $code = @'
const qrcode = require("qrcode-generator");
const text = process.argv[process.argv.length - 1];
const qr = qrcode(0, "Q");
qr.addData(text);
qr.make();
const rows = [];
for (let r = 0; r < qr.getModuleCount(); r++) {
  const row = [];
  for (let c = 0; c < qr.getModuleCount(); c++) row.push(qr.isDark(r, c) ? 1 : 0);
  rows.push(row);
}
console.log(JSON.stringify({ count: qr.getModuleCount(), rows }));
'@
    $tempDir = Join-Path $Root "tmp"
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    $tempScript = Join-Path $tempDir "luban-election-qr-$PID.js"
    Set-Content -LiteralPath $tempScript -Value $code -Encoding UTF8
    try {
        $json = & node $tempScript $Text
        if ($LASTEXITCODE -ne 0) {
            throw "Unable to generate QR matrix for $Text"
        }
        return $json | ConvertFrom-Json
    }
    finally {
        if (Test-Path -LiteralPath $tempScript) {
            Remove-Item -LiteralPath $tempScript -Force
        }
    }
}

function Draw-Qr {
    param(
        [System.Drawing.Graphics]$Graphics,
        $Matrix,
        [System.Drawing.RectangleF]$Rect,
        [string]$Fore = "#1c1917",
        [string]$Back = "#ffffff"
    )
    $backBrush = [System.Drawing.SolidBrush]::new((Color-Hex $Back))
    Fill-RoundedRect $Graphics $backBrush $Rect 18
    $backBrush.Dispose()
    $quietModules = 4
    $count = [int]$Matrix.count
    $moduleSize = [Math]::Floor([Math]::Min($Rect.Width, $Rect.Height) / ($count + ($quietModules * 2)))
    $qrSize = $moduleSize * ($count + ($quietModules * 2))
    $startX = $Rect.X + (($Rect.Width - $qrSize) / 2) + ($quietModules * $moduleSize)
    $startY = $Rect.Y + (($Rect.Height - $qrSize) / 2) + ($quietModules * $moduleSize)
    $foreBrush = [System.Drawing.SolidBrush]::new((Color-Hex $Fore))
    for ($r = 0; $r -lt $count; $r++) {
        for ($c = 0; $c -lt $count; $c++) {
            if ([int]$Matrix.rows[$r][$c] -eq 1) {
                $Graphics.FillRectangle($foreBrush, $startX + ($c * $moduleSize), $startY + ($r * $moduleSize), $moduleSize + 0.2, $moduleSize + 0.2)
            }
        }
    }
    $foreBrush.Dispose()
}

function Draw-BrandHeader {
    param([System.Drawing.Graphics]$Graphics, [int]$Width, [int]$Height)
    $logoRect = New-RectF 70 58 92 92
    Draw-ContainedImage $Graphics (Join-Path $Root "logo.png") $logoRect

    $titleBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#7c2d1f"))
    $smallBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#57534e"))
    $titleFont = New-Font "Segoe UI" 31 ([System.Drawing.FontStyle]::Bold)
    $smallFont = New-Font "Segoe UI" 22 ([System.Drawing.FontStyle]::Regular)
    $Graphics.DrawString("Luban Workshop Restaurant", $titleFont, $titleBrush, (New-RectF 178 65 590 38))
    $Graphics.DrawString("lubanrestaurant.com", $smallFont, $smallBrush, (New-RectF 180 105 430 34))
    $titleFont.Dispose()
    $smallFont.Dispose()
    $titleBrush.Dispose()
    $smallBrush.Dispose()
}

function Draw-CommonFooter {
    param(
        [System.Drawing.Graphics]$Graphics,
        $Matrix,
        [int]$Width,
        [int]$Height,
        [string]$Cta = "Scan menu"
    )
    $qrRect = New-RectF ($Width - 246) ($Height - 246) 176 176
    Draw-Qr $Graphics $Matrix $qrRect
    $brush = [System.Drawing.SolidBrush]::new((Color-Hex "#292524"))
    $font = New-Font "Segoe UI" 22 ([System.Drawing.FontStyle]::Bold)
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $Graphics.DrawString($Cta, $font, $brush, (New-RectF ($Width - 258) ($Height - 63) 200 32), $format)
    $format.Dispose()
    $font.Dispose()
    $brush.Dispose()
}

function New-Canvas {
    param([int]$Width, [int]$Height)
    $bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-Canvas {
    param($Canvas, [string]$OutPath)
    $Canvas.Bitmap.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $Canvas.Graphics.Dispose()
    $Canvas.Bitmap.Dispose()
    Write-Host "Created $OutPath"
}

function Draw-SquarePost {
    param(
        [string]$OutName,
        [string]$Level,
        [string]$Headline,
        [string]$Body,
        [string]$Photo,
        [string]$Mascot,
        [string]$Accent = "#b91c1c",
        [string]$Badge = "Election Season"
    )
    $canvas = New-Canvas 1080 1080
    $g = $canvas.Graphics
    $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new((New-RectF 0 0 1080 1080), (Color-Hex "#fff6e8"), (Color-Hex "#f8e7c8"), 45)
    $g.FillRectangle($bg, 0, 0, 1080, 1080)
    $bg.Dispose()

    $orb = [System.Drawing.SolidBrush]::new((Color-Hex $Accent 22))
    $g.FillEllipse($orb, -150, 650, 520, 520)
    $g.FillEllipse($orb, 720, -110, 470, 470)
    $orb.Dispose()

    Draw-BrandHeader $g 1080 1080
    Draw-Label $g $Badge 70 190 420 $Accent

    $headlineBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#1c1917"))
    $bodyBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#57534e"))
    $headlineFormat = [System.Drawing.StringFormat]::new()
    $headlineFormat.Alignment = [System.Drawing.StringAlignment]::Near
    $headlineFormat.LineAlignment = [System.Drawing.StringAlignment]::Near
    Draw-FitText $g $Headline "Segoe UI" 76 44 ([System.Drawing.FontStyle]::Bold) $headlineBrush (New-RectF 70 270 620 225) $headlineFormat
    $bodyFont = New-Font "Segoe UI" 33 ([System.Drawing.FontStyle]::Regular)
    $g.DrawString($Body, $bodyFont, $bodyBrush, (New-RectF 72 514 585 154), $headlineFormat)
    $bodyFont.Dispose()

    $levelFont = New-Font "Segoe UI" 28 ([System.Drawing.FontStyle]::Bold)
    $levelBrush = [System.Drawing.SolidBrush]::new((Color-Hex $Accent))
    $g.DrawString($Level, $levelFont, $levelBrush, (New-RectF 72 692 560 40))
    $levelFont.Dispose()
    $levelBrush.Dispose()

    $photoRect = New-RectF 70 768 365 222
    Draw-CoverImage $g (Join-Path $Root $Photo) $photoRect 28
    $borderPen = [System.Drawing.Pen]::new((Color-Hex "#ffffff"), 8)
    Stroke-RoundedRect $g $borderPen $photoRect 28
    $borderPen.Dispose()

    Draw-BallotIcon $g 455 772 160 132
    Draw-ContainedImage $g (Join-Path $Root $Mascot) (New-RectF 585 322 442 560)
    Draw-CommonFooter $g $script:QrMatrix 1080 1080

    $headlineFormat.Dispose()
    $headlineBrush.Dispose()
    $bodyBrush.Dispose()
    Save-Canvas $canvas (Join-Path $CampaignDir $OutName)
}

function Draw-StoryPost {
    param(
        [string]$OutName,
        [string]$Headline,
        [string]$Body,
        [string[]]$Pills,
        [string]$Photo,
        [string]$Mascot,
        [string]$Accent = "#b91c1c"
    )
    $canvas = New-Canvas 1080 1920
    $g = $canvas.Graphics
    $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new((New-RectF 0 0 1080 1920), (Color-Hex "#fff6e8"), (Color-Hex "#f3d39a"), 90)
    $g.FillRectangle($bg, 0, 0, 1080, 1920)
    $bg.Dispose()

    Draw-CoverImage $g (Join-Path $Root $Photo) (New-RectF 0 1120 1080 800) 0 0.36
    $overlay = [System.Drawing.SolidBrush]::new((Color-Hex "#1c1917" 98))
    $g.FillRectangle($overlay, 0, 1120, 1080, 800)
    $overlay.Dispose()

    Draw-BrandHeader $g 1080 1920
    Draw-Label $g "Hall  SRC  LNUGS" 70 205 382 $Accent

    $headlineBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#1c1917"))
    $bodyBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#57534e"))
    $format = [System.Drawing.StringFormat]::new()
    Draw-FitText $g $Headline "Segoe UI" 93 54 ([System.Drawing.FontStyle]::Bold) $headlineBrush (New-RectF 70 310 850 285) $format
    $bodyFont = New-Font "Segoe UI" 38 ([System.Drawing.FontStyle]::Regular)
    $g.DrawString($Body, $bodyFont, $bodyBrush, (New-RectF 75 632 780 150), $format)
    $bodyFont.Dispose()

    $pillY = 840
    foreach ($pill in $Pills) {
        Draw-Label $g $pill 70 $pillY 390 "#7c2d1f"
        $pillY += 82
    }

    Draw-ContainedImage $g (Join-Path $Root $Mascot) (New-RectF 512 778 520 615)

    $qrCard = New-RectF 70 1430 940 360
    $cardBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#ffffff" 242))
    Fill-RoundedRect $g $cardBrush $qrCard 34
    $cardBrush.Dispose()
    Draw-Qr $g $script:QrMatrix (New-RectF 110 1473 250 250)
    $ctaBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#1c1917"))
    $ctaFont = New-Font "Segoe UI" 46 ([System.Drawing.FontStyle]::Bold)
    $smallFont = New-Font "Segoe UI" 32 ([System.Drawing.FontStyle]::Regular)
    $g.DrawString("Scan for menu", $ctaFont, $ctaBrush, (New-RectF 395 1492 520 64))
    $g.DrawString("lubanrestaurant.com", $smallFont, $ctaBrush, (New-RectF 397 1565 500 48))
    $g.DrawString("Meals for campaign teams, voters and supporters.", $smallFont, $ctaBrush, (New-RectF 397 1622 520 88))
    $ctaFont.Dispose()
    $smallFont.Dispose()
    $ctaBrush.Dispose()

    $format.Dispose()
    $headlineBrush.Dispose()
    $bodyBrush.Dispose()
    Save-Canvas $canvas (Join-Path $CampaignDir $OutName)
}

function Draw-FlyerPost {
    param([string]$OutName)
    $canvas = New-Canvas 1080 1350
    $g = $canvas.Graphics
    $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new((New-RectF 0 0 1080 1350), (Color-Hex "#1c1917"), (Color-Hex "#7c2d1f"), 55)
    $g.FillRectangle($bg, 0, 0, 1080, 1350)
    $bg.Dispose()
    Draw-CoverImage $g (Join-Path $Root "assets\luban-noodle-spread.jpg") (New-RectF 0 770 1080 580) 0 0.45

    $logoBack = [System.Drawing.SolidBrush]::new((Color-Hex "#fff6e8" 238))
    $g.FillEllipse($logoBack, 62, 54, 104, 104)
    $logoBack.Dispose()
    $logoRect = New-RectF 70 62 88 88
    Draw-ContainedImage $g (Join-Path $Root "logo.png") $logoRect
    $white = [System.Drawing.SolidBrush]::new((Color-Hex "#ffffff"))
    $gold = [System.Drawing.SolidBrush]::new((Color-Hex "#d9a441"))
    $muted = [System.Drawing.SolidBrush]::new((Color-Hex "#fff6e8"))
    $brandFont = New-Font "Segoe UI" 31 ([System.Drawing.FontStyle]::Bold)
    $g.DrawString("Luban Workshop Restaurant", $brandFont, $white, (New-RectF 178 70 650 42))
    $brandFont.Dispose()

    $labelFont = New-Font "Segoe UI" 29 ([System.Drawing.FontStyle]::Bold)
    $g.DrawString("Student Election Meal Stop", $labelFont, $gold, (New-RectF 70 202 760 42))
    $labelFont.Dispose()

    $fmt = [System.Drawing.StringFormat]::new()
    Draw-FitText $g "Hall, SRC & LNUGS campaign teams are welcome." "Segoe UI" 78 48 ([System.Drawing.FontStyle]::Bold) $white (New-RectF 70 275 780 250) $fmt
    $bodyFont = New-Font "Segoe UI" 34 ([System.Drawing.FontStyle]::Regular)
    $g.DrawString("Plan team meals, manifesto-night bites, election-day stops and results-night gatherings with Luban.", $bodyFont, $muted, (New-RectF 76 560 740 142), $fmt)
    $bodyFont.Dispose()

    $card = New-RectF 70 820 940 390
    $cardBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#fff6e8" 242))
    Fill-RoundedRect $g $cardBrush $card 36
    $cardBrush.Dispose()
    Draw-Qr $g $script:QrMatrix (New-RectF 118 870 265 265)
    $dark = [System.Drawing.SolidBrush]::new((Color-Hex "#1c1917"))
    $ctaFont = New-Font "Segoe UI" 49 ([System.Drawing.FontStyle]::Bold)
    $smallFont = New-Font "Segoe UI" 31 ([System.Drawing.FontStyle]::Regular)
    $g.DrawString("Scan the menu", $ctaFont, $dark, (New-RectF 418 890 520 70))
    $g.DrawString("lubanrestaurant.com", $smallFont, $dark, (New-RectF 421 970 500 50))
    $g.DrawString("Neutral food campaign. No candidate endorsement.", $smallFont, $dark, (New-RectF 421 1034 500 86))
    $ctaFont.Dispose()
    $smallFont.Dispose()
    $dark.Dispose()

    Draw-ContainedImage $g (Join-Path $Root "assets\mascots\extra\bao-extra-pose-40-team-huddle.png") (New-RectF 700 570 360 390)
    $fmt.Dispose()
    $white.Dispose()
    $gold.Dispose()
    $muted.Dispose()
    Save-Canvas $canvas (Join-Path $CampaignDir $OutName)
}

function Draw-QrOnlyCard {
    param([string]$OutName)
    $canvas = New-Canvas 1080 1080
    $g = $canvas.Graphics
    $bg = [System.Drawing.SolidBrush]::new((Color-Hex "#fff6e8"))
    $g.FillRectangle($bg, 0, 0, 1080, 1080)
    $bg.Dispose()
    Draw-BrandHeader $g 1080 1080

    $accent = [System.Drawing.SolidBrush]::new((Color-Hex "#b91c1c"))
    $title = New-Font "Segoe UI" 70 ([System.Drawing.FontStyle]::Bold)
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("Scan for Luban", $title, $accent, (New-RectF 80 190 920 90), $format)
    $title.Dispose()
    $accent.Dispose()
    Draw-Qr $g $script:QrMatrix (New-RectF 230 315 620 620)
    $dark = [System.Drawing.SolidBrush]::new((Color-Hex "#1c1917"))
    $font = New-Font "Segoe UI" 38 ([System.Drawing.FontStyle]::Bold)
    $g.DrawString("lubanrestaurant.com", $font, $dark, (New-RectF 80 955 920 58), $format)
    $font.Dispose()
    $format.Dispose()
    $dark.Dispose()
    Save-Canvas $canvas (Join-Path $CampaignDir $OutName)
}

function Export-StandaloneQr {
    param([string]$OutPath)
    $canvas = New-Canvas 1400 1400
    $g = $canvas.Graphics
    $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $g.FillRectangle($white, 0, 0, 1400, 1400)
    $white.Dispose()
    Draw-Qr $g $script:QrMatrix (New-RectF 0 0 1400 1400) "#000000" "#ffffff"
    Save-Canvas $canvas $OutPath
}

$script:QrMatrix = Get-QrMatrix $SiteUrl

Export-StandaloneQr (Join-Path $QrDir "lubanrestaurant-com.png")

Draw-SquarePost `
    -OutName "election-season-feed.png" `
    -Level "Hall, SRC & LNUGS" `
    -Headline "Fuel the Campaign Trail" `
    -Body "Meals for student leaders, volunteers, voters and supporters between rallies, manifesto nights and results watch." `
    -Photo "assets\luban-noodle-spread.jpg" `
    -Mascot "assets\mascots\extra\bao-extra-pose-31-scan-card.png" `
    -Accent "#b91c1c" `
    -Badge "Campus Election Season"

Draw-SquarePost `
    -OutName "hall-level-feed.png" `
    -Level "Hall Level" `
    -Headline "Hall Campaign Nights" `
    -Body "After manifesto prep, room-to-room runs and late meetings, bring the team together at Luban." `
    -Photo "assets\menu-items-pictures\N1.jpg" `
    -Mascot "assets\mascots\poses\luban-mascot-pose-01-wave.png" `
    -Accent "#7c2d1f" `
    -Badge "Hall Elections"

Draw-SquarePost `
    -OutName "src-level-feed.png" `
    -Level "SRC Level" `
    -Headline "SRC Election Week Fuel" `
    -Body "Debate teams, campaign managers, volunteers and friends can scan the menu and plan a proper food stop." `
    -Photo "assets\menu-items-pictures\R1.jpg" `
    -Mascot "assets\mascots\poses\luban-mascot-pose-06-pointing.png" `
    -Accent "#0f766e" `
    -Badge "SRC Elections"

Draw-SquarePost `
    -OutName "lnugs-level-feed.png" `
    -Level "LNUGS Level" `
    -Headline "LNUGS Election Energy" `
    -Body "For delegate meetups, supporters and student leaders who need warm meals before the next stop." `
    -Photo "assets\menu-items-pictures\D1.jpg" `
    -Mascot "assets\mascots\extra\bao-extra-pose-40-team-huddle.png" `
    -Accent "#a16207" `
    -Badge "LNUGS Elections"

Draw-SquarePost `
    -OutName "election-day-feed.png" `
    -Level "Election Day" `
    -Headline "Vote. Reset. Eat Together." `
    -Body "Win, learn or wait for results together. Keep the mood warm and the food ready." `
    -Photo "assets\menu-items-pictures\Q1.jpg" `
    -Mascot "assets\mascots\poses\luban-mascot-pose-08-celebration.png" `
    -Accent "#b91c1c" `
    -Badge "Results Watch"

Draw-QrOnlyCard "scan-menu-feed.png"

Draw-StoryPost `
    -OutName "election-season-story.png" `
    -Headline "Election season? Keep your team fed." `
    -Body "From hall campaigns to SRC and LNUGS stops, Luban is ready for the rush." `
    -Pills @("Team meals", "Quick menu scan", "Results night stop") `
    -Photo "assets\luban-noodle-spread.jpg" `
    -Mascot "assets\mascots\extra\bao-extra-pose-31-scan-card.png" `
    -Accent "#b91c1c"

Draw-StoryPost `
    -OutName "manifesto-night-story.png" `
    -Headline "Manifesto night fuel starts here." `
    -Body "Meet after the hall, compare notes, and share something warm." `
    -Pills @("Noodles", "Dumplings", "Fried rice") `
    -Photo "assets\menu-items-pictures\N6.jpg" `
    -Mascot "assets\mascots\poses\luban-mascot-pose-03-noodles.png" `
    -Accent "#7c2d1f"

Draw-StoryPost `
    -OutName "results-night-story.png" `
    -Headline "Results night plans? Gather at Luban." `
    -Body "For campaign teams, friends and supporters after the count." `
    -Pills @("Celebrate", "Regroup", "Share a meal") `
    -Photo "assets\menu-items-pictures\R7.jpg" `
    -Mascot "assets\mascots\poses\luban-mascot-pose-08-celebration.png" `
    -Accent "#a16207"

Draw-FlyerPost "student-election-meal-stop-flyer.png"
