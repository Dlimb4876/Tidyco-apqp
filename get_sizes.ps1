$files = Get-ChildItem -Path 'c:\Users\Tidyco\Documents\VScode\Tidyco-apqp' -Include *.js,*.css,*.html -Recurse | Where-Object { $_.FullName -notlike '*node_modules*' }
$results = $files | ForEach-Object {
    [PSCustomObject]@{
        SizeKB = [math]::Round($_.Length / 1KB, 2)
        Path = $_.FullName
    }
} | Sort-Object SizeKB -Descending | Select-Object -First 25

$results | Format-Table -AutoSize -Wrap | Out-File -FilePath 'c:\Users\Tidyco\Documents\VScode\Tidyco-apqp\sizes_output.txt' -Width 500
