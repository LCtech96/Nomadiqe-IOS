# Apre la porta 8081 nel Firewall di Windows per Expo Metro.
# Esegui come Amministratore, poi incolla:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   & "C:\Users\luca\Desktop\repo\Nomadiqe IOS\nomadiqe-ios\scripts\open-firewall.ps1"
# (modifica il percorso se il progetto e in un'altra cartella)

$ruleName = "Expo Metro 8081"
$port = 8081

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Regola '$ruleName' gia presente." -ForegroundColor Yellow
    exit 0
}

New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -Profile Any
Write-Host "Regola firewall creata: porta $port aperta." -ForegroundColor Green
