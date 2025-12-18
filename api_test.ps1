$headers = @{ "Content-Type" = "application/json" }
$body = @{
    dni = "11111111"
    password = "admin123"
} | ConvertTo-Json

try {
    Write-Host "Attempting login with DNI..."
    $authResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/Auth/login" -Method Post -Headers $headers -Body $body
    $token = $authResponse.token
    Write-Host "Token obtained: $($token.Substring(0, 10))..."

    $headers.Add("Authorization", "Bearer $token")

    Write-Host "Fetching Galpones..."
    $galpones = Invoke-RestMethod -Uri "http://localhost:5000/api/stock-general/galpones" -Method Get -Headers $headers
    Write-Host "Galpones Response:"
    $galpones | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
