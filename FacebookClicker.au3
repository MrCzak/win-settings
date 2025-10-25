; --- Konfiguracja skryptu ---
Local $iClickX = 745                           ; Współrzędna X dla pierwszego kliknięcia myszką
Local $iClickY = 275                           ; Początkowa współrzędna Y dla pierwszego kliknięcia myszką
Local $iNumberOfClicks = 82                    ; Liczba akcji (pierwsza to MOUSEMOVE+MOUSECLICK, reszta to TAB+ENTER)

Local $sIDMWindowTitle = "Pobieranie pliku"    ; Dokładna nazwa okna Internet Download Managera
Local $sIDMButtonToClick = "Button2"           ; Przycisk do kliknięcia w głównym oknie IDM
Local $sIDMEditControl = "Edit4"               ; Nazwa kontrolki pola tekstowego do wpisania ścieżki pliku
Local $sIDMFilePathBase = "C:\FACEBOOK\"       ; Bazowa ścieżka do pliku
Local $sIDMFileExtension = ".zip"              ; Rozszerzenie pliku
Local $iIDMWaitTime = 10                       ; Czas (w sekundach) na czekanie na główne okno IDM

; --- Konfiguracja Opóźnień (minimalne opóźnienie to 100ms) ---
Local $iWaitAfterAction = 2000                 ; Opóźnienie po akcji (kliknięcie/TAB+ENTER) (w milisekundach)
Local $iSleepAfterTab = 200                    ; Opóźnienie po wysłaniu klawisza TAB (w milisekundach)
Local $iSleepControlFocus = 200                ; Opóźnienie po ustawieniu fokusu na kontrolce
Local $iSleepAfterClipPut = 200                ; NOWA: Opóźnienie po skopiowaniu do schowka
Local $iSleepAfterCtrlA = 200                  ; NOWA: Opóźnienie po wysłaniu Ctrl+A
Local $iSleepAfterCtrlV = 200                  ; NOWA: Opóźnienie po wysłaniu Ctrl+V
Local $iSleepAfterIDMButtonClick = 500         ; Opóźnienie po kliknięciu głównego przycisku IDM
Local $iSleepAfterSaveAsButtonClick = 500      ; Opóźnienie po kliknięciu przycisku "Zachowaj jako..."
Local $iSleepEndOfScript = 3000                ; NOWA: Opóźnienie na końcu skryptu przed usunięciem ToolTip

; --- Zmienne dla nowego okna IDM ---
Local $sIDMSaveAsWindowTitle = "Zachowaj jako..." ; Nazwa tytułu okna "Zachowaj jako..."
Local $sIDMSaveAsButtonToClick = "Button1"     ; Przycisk do kliknięcia w oknie "Zachowaj jako..."
Local $iIDMSaveAsWaitTime = 1                  ; Czas (w sekundach) na czekanie na okno "Zachowaj jako..."

; --- Zmienna dla licznika akcji ---
Local $iCurrentClick = 0                       ; Licznik wykonanych akcji


; --- Główna funkcja skryptu ---
Func Main()
    For $iCurrentClick = 1 To $iNumberOfClicks ; Pętla wykonująca określoną liczbę akcji

        ; --- Warunkowa aktywacja elementu (MOUSEMOVE+MOUSECLICK vs TAB+ENTER) ---
        If $iCurrentClick = 1 Then
            MouseMove($iClickX, $iClickY) ; Przesuń kursor myszy
            MouseClick("left")            ; Wykonaj kliknięcie lewym przyciskiem myszy w aktualnej pozycji
        Else
            Send("{TAB}")
            Sleep($iSleepAfterTab)        ; Opóźnienie po TAB
            Send("{ENTER}")
        EndIf

        ; Czekaj po akcji
        Sleep($iWaitAfterAction)

        ; Czekaj na główne okno Internet Download Managera
        Local $hIDMWindow = WinWait($sIDMWindowTitle, "", $iIDMWaitTime)

        If $hIDMWindow Then
            ; Skonstruuj ścieżkę pliku z nowym formatowaniem nazwy
            Local $sFileName = $iCurrentClick & "z" & $iNumberOfClicks & $sIDMFileExtension
            Local $sFullFilePath = $sIDMFilePathBase & $sFileName

            ; --- WPROWADZENIE TEKSTU PRZEZ CTRL+A, CTRL+V ---
            ClipPut($sFullFilePath) ; Skopiuj ścieżkę do schowka
            Sleep($iSleepAfterClipPut) ; Opóźnienie po ClipPut

            ControlFocus($hIDMWindow, "", $sIDMEditControl)
            Sleep($iSleepControlFocus)

            Send("^a") ; Zaznacz wszystko (Ctrl+A)
            Sleep($iSleepAfterCtrlA) ; Opóźnienie po Ctrl+A
            Send("^v") ; Wklej (Ctrl+V)
            Sleep($iSleepAfterCtrlV) ; Opóźnienie po Ctrl+V
            ; --- KONIEC WPROWADZANIA TEKSTU ---

            ; Teraz kliknij Button2
            ControlClick($hIDMWindow, "", $sIDMButtonToClick)
            Sleep($iSleepAfterIDMButtonClick)

            ; --- Sprawdzenie i obsługa okna "Zachowaj jako..." ---
            Local $hIDMSaveAsWindow = WinWait($sIDMSaveAsWindowTitle, "", $iIDMSaveAsWaitTime)

            If $hIDMSaveAsWindow Then
                ControlClick($hIDMSaveAsWindow, "", $sIDMSaveAsButtonToClick)
                Sleep($iSleepAfterSaveAsButtonClick)
            EndIf
            ; --- Koniec obsługi okna "Zachowaj jako..." ---

        EndIf
    Next

    ToolTip("Skrypt zakończył działanie.", 0, 0, "Info", 2)
    Sleep($iSleepEndOfScript) ; Opóźnienie na końcu skryptu
    ToolTip("") ; Usuń ToolTip
EndFunc

; --- Wywołanie głównej funkcji ---
Main()
