curl -L -o C:\Windows\Panther\autounattend.xml https://raw.githubusercontent.com/MrCzak/win-settings/refs/heads/main/autounattend.xml
%WINDIR%\System32\Sysprep\Sysprep.exe /oobe /unattend:C:\Windows\Panther\autounattend.xml /reboot
