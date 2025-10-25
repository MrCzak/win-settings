// content_script_loader.js (Ten skrypt jest wstrzykiwany na strony Steam Workshop)

let isHideModeActive = false; // Domyślnie tryb ukrywania jest nieaktywny
let showFiltersButton = null;
let toggleHideModeButton = null; // Przycisk do przełączania trybu ukrywania

// Funkcja do wysyłania wiadomości do Service Workera (background.js)
async function sendMessageToBackground(action, data = {}) {
  try {
    const response = await chrome.runtime.sendMessage({ action, ...data });
    return response;
  } catch (error) {
    console.error("Content: Błąd wysyłania wiadomości do tła:", error);
    throw error; // Przekaż błąd dalej
  }
}

// Funkcja do aktualizacji stanu przycisków
function updateButtonState() {
  if (showFiltersButton) {
    showFiltersButton.textContent = isHideModeActive ? "AKTYWNY Tryb Ukrywania" : "Pokaż/Kopiuj Zebrane Filtry";
    showFiltersButton.style.backgroundColor = isHideModeActive ? "#dc3545" : "#007bff"; // Czerwony dla aktywnego, niebieski dla nieaktywnego
    showFiltersButton.style.borderColor = isHideModeActive ? "#dc3545" : "#007bff";
  }
  if (toggleHideModeButton) {
      toggleHideModeButton.textContent = isHideModeActive ? "Wyłącz Tryb Ukrywania" : "Włącz Tryb Ukrywania";
      toggleHideModeButton.style.backgroundColor = isHideModeActive ? "#ffc107" : "#28a745"; // Żółty dla aktywnego, zielony dla nieaktywnego
      toggleHideModeButton.style.borderColor = isHideModeActive ? "#ffc107" : "#28a745";
  }
}

// Funkcja do przełączania trybu ukrywania
async function toggleHideMode() {
  isHideModeActive = !isHideModeActive;
  updateButtonState();
  if (isHideModeActive) {
    console.log("Content: Tryb ukrywania modów AKTYWOWANY!");
  } else {
    console.log("Content: Tryb ukrywania modów DEZAKTYWOWANY!");
  }
  highlightFilteredMods(); // Odśwież podświetlenie po zmianie trybu
}

// Nasłuchiwanie na wiadomości od service workera (nie zmienia się)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleHideMode") {
    toggleHideMode();
  }
});

// === NOWA FUNKCJA DO OBSŁUGI CZYSZCZENIA FILTRÓW ===
async function handleClearFilters() {
    if (confirm("Czy na pewno chcesz wyczyścić WSZYSTKIE zebrane filtry? Tej operacji nie można cofnąć.")) {
        const response = await sendMessageToBackground("clearCollectedFilters");
        if (response.success) {
            alert(response.message);
            // Po wyczyszczeniu, odśwież modal i podświetlenie modów
            const textarea = document.getElementById('steam-workshop-mod-hider-textarea');
            if (textarea) {
                textarea.value = ""; // Wyczyść pole tekstowe w modalu
            }
            highlightFilteredMods(); // Usuń wszystkie podświetlenia
        } else {
            alert("Błąd podczas czyszczenia filtrów: " + response.error);
        }
    }
}

// === Funkcja do obsługi wyświetlania i kopiowania zebranych filtrów (ZMODYFIKOWANA) ===
async function handleShowFilters() {
  const response = await sendMessageToBackground("getCollectedFilters");
  if (response.success && response.filters) { // Sprawdź, czy response.filters istnieje
    const filtersText = response.filters.join('\n');

    // --- LOGIKA TWORZENIA/AKTUALIZACJI OKNA MODALNEGO ---
    const modalId = 'steam-workshop-mod-hider-modal';
    let modal = document.getElementById(modalId);
    if (!modal) { // Utwórz modal tylko raz, jeśli jeszcze nie istnieje
      modal = document.createElement('div');
      modal.id = modalId;
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.backgroundColor = 'rgba(40, 44, 52, 0.95)'; // Ciemny tło
      modal.style.border = '1px solid #4a4f58';
      modal.style.borderRadius = '8px';
      modal.style.padding = '20px';
      modal.style.zIndex = '10000'; // Upewnij się, że jest na wierzchu
      modal.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
      modal.style.fontFamily = 'Arial, sans-serif';
      modal.style.color = '#e0e0e0'; // Jasny tekst
      modal.style.fontSize = '14px';
      modal.style.width = 'fit-content';
      modal.style.maxWidth = '90%';

      const title = document.createElement('h3');
      title.textContent = 'Filtry uBlock Origin';
      title.style.marginTop = '0';
      title.style.marginBottom = '15px';
      title.style.color = '#c0c0c0';
      modal.appendChild(title);

      const textarea = document.createElement('textarea');
      textarea.id = 'steam-workshop-mod-hider-textarea';
      textarea.value = filtersText;
      textarea.style.width = '400px';
      textarea.style.height = '150px';
      textarea.style.backgroundColor = '#2c3038';
      textarea.style.color = '#ffffff';
      textarea.style.border = '1px solid #555';
      textarea.style.padding = '10px';
      textarea.style.borderRadius = '4px';
      textarea.style.resize = 'vertical';
      textarea.readOnly = true;
      textarea.style.fontFamily = 'monospace';
      textarea.style.fontSize = '12px';
      // Skopiuj przy kliknięciu na textarea
      textarea.onclick = function() {
          this.select();
          document.execCommand('copy');
          alert('Filtry skopiowane do schowka!');
      };
      modal.appendChild(textarea);

      const instructions = document.createElement('p');
      instructions.textContent = "Kliknij w pole tekstowe, aby skopiować filtry. Wklej je ręcznie do sekcji 'Moje filtry' w uBlock Origin.";
      instructions.style.fontSize = '11px';
      instructions.style.color = '#aaaaaa';
      instructions.style.marginTop = '15px';
      modal.appendChild(instructions);

      // Kontener na przyciski
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'space-between'; // Rozsuń przyciski
      buttonContainer.style.marginTop = '20px';
      buttonContainer.style.width = '100%';

      const closeButton = document.createElement('button');
      closeButton.textContent = 'Zamknij';
      closeButton.style.padding = '8px 15px';
      closeButton.style.backgroundColor = '#007bff';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = function() {
        modal.style.display = 'none';
        document.getElementById('steam-workshop-mod-hider-overlay').style.display = 'none';
      };
      buttonContainer.appendChild(closeButton);

      const clearButton = document.createElement('button'); // <-- NOWY PRZYCISK CZYSZCZENIA
      clearButton.textContent = 'Wyczyść Zebrane Filtry';
      clearButton.style.padding = '8px 15px';
      clearButton.style.backgroundColor = '#dc3545'; // Czerwony kolor dla wyróżnienia
      clearButton.style.color = 'white';
      clearButton.style.border = 'none';
      clearButton.style.borderRadius = '4px';
      clearButton.style.cursor = 'pointer';
      clearButton.style.marginLeft = '10px'; // Dodaj trochę odstępu
      clearButton.onclick = handleClearFilters; // Przypisz nową funkcję
      buttonContainer.appendChild(clearButton);

      modal.appendChild(buttonContainer); // Dodaj kontener z przyciskami do modala

      document.body.appendChild(modal);

      // Dodaj overlay tła
      const overlay = document.createElement('div');
      overlay.id = 'steam-workshop-mod-hider-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
      overlay.style.zIndex = '9999';
      overlay.onclick = function() {
        modal.style.display = 'none';
        overlay.style.display = 'none';
      };
      document.body.appendChild(overlay);

    } else {
      // Jeśli modal już istnieje, zaktualizuj tylko wartość textarea i pokaż go
      document.getElementById('steam-workshop-mod-hider-textarea').value = filtersText;
      modal.style.display = 'block';
      document.getElementById('steam-workshop-mod-hider-overlay').style.display = 'block';
    }

  } else if (response.success && response.filters.length === 0) { // Obsługa braku filtrów
    alert("Brak zebranych filtrów.");
  } else {
    alert("Błąd podczas pobierania filtrów: " + (response.error || "Nieznany błąd"));
  }
}

// Funkcja do tworzenia i dodawania przycisków na stronie (nie zmienia się poza nazwą w konsoli)
function createActionButtons() {
  // Przycisk "Pokaż/Kopiuj Zebrane Filtry"
  if (!document.getElementById('show-filters-button')) {
    showFiltersButton = document.createElement('button');
    showFiltersButton.id = 'show-filters-button';
    showFiltersButton.textContent = 'Pokaż/Kopiuj Zebrane Filtry';
    showFiltersButton.style.position = 'fixed';
    showFiltersButton.style.bottom = '20px';
    showFiltersButton.style.right = '20px';
    showFiltersButton.style.padding = '10px 15px';
    showFiltersButton.style.backgroundColor = '#007bff';
    showFiltersButton.style.color = 'white';
    showFiltersButton.style.border = '1px solid #007bff';
    showFiltersButton.style.borderRadius = '5px';
    showFiltersButton.style.cursor = 'pointer';
    showFiltersButton.style.zIndex = '9999';
    showFiltersButton.style.fontSize = '16px';
    showFiltersButton.style.marginBottom = '0px';
    showFiltersButton.addEventListener('click', handleShowFilters);
    document.body.appendChild(showFiltersButton);
    console.log("Content: Przycisk 'Pokaż/Kopiuj Zebrane Filtry' dodany.");
  } else {
    showFiltersButton = document.getElementById('show-filters-button');
    console.log("Content: Przycisk 'Pokaż/Kopiuj Zebrane Filtry' już istnieje.");
  }

  // Przycisk "Włącz/Wyłącz Tryb Ukrywania"
  if (!document.getElementById('toggle-hide-mode-button')) {
    toggleHideModeButton = document.createElement('button');
    toggleHideModeButton.id = 'toggle-hide-mode-button';
    toggleHideModeButton.textContent = 'Włącz Tryb Ukrywania';
    toggleHideModeButton.style.position = 'fixed';
    toggleHideModeButton.style.bottom = '70px';
    toggleHideModeButton.style.right = '20px';
    toggleHideModeButton.style.padding = '10px 15px';
    toggleHideModeButton.style.backgroundColor = '#28a745';
    toggleHideModeButton.style.color = 'white';
    toggleHideModeButton.style.border = '1px solid #28a745';
    toggleHideModeButton.style.borderRadius = '5px';
    toggleHideModeButton.style.cursor = 'pointer';
    toggleHideModeButton.style.zIndex = '9999';
    toggleHideModeButton.style.fontSize = '16px';
    toggleHideModeButton.addEventListener('click', toggleHideMode);
    document.body.appendChild(toggleHideModeButton);
    console.log("Content: Przycisk 'Włącz/Wyłącz Tryb Ukrywania' dodany.");
  } else {
    toggleHideModeButton = document.getElementById('toggle-hide-mode-button');
    console.log("Content: Przycisk 'Włącz/Wyłącz Tryb Ukrywania' już istnieje.");
  }

  updateButtonState();
}


// === NOWE FUNKCJE DLA WIZUALIZACJI FILTROWANYCH MODÓW ===

// Funkcja do wstrzykiwania stylów CSS (Ostrzejsze krawędzie - tak jak prosiłeś)
function injectCSS() {
  const style = document.createElement('style');
  style.id = 'mod-hider-styles';
  style.textContent = `
    .mod-hider-filtered-item {
      box-shadow: 0 0 10px 5px rgba(255, 0, 0, 0.7) !important;
      border: 2px solid rgba(255, 0, 0, 0.7) !important;
      transition: box-shadow 0.3s ease-in-out, border 0.3s ease-in-out;
    }
  `;
  document.head.appendChild(style);
  console.log("Content: Wstrzyknięto zaktualizowane style CSS dla zaznaczonych modów.");
}

// Funkcja do podświetlania modów na podstawie listy filtrów (bez zmian)
async function highlightFilteredMods() {
  console.log("Content: Rozpoczynam podświetlanie przefiltrowanych modów...");
  const response = await sendMessageToBackground("getCollectedFilters");
  if (response.success && response.filters.length > 0) {
    const collectedFilters = new Set(response.filters);

    const workshopItems = document.querySelectorAll('.workshopItem');

    workshopItems.forEach(item => {
      const linkElement = item.querySelector("a[href*='/sharedfiles/filedetails/']");
      if (linkElement) {
        const url = new URL(linkElement.href);
        const modId = url.searchParams.get("id");
        if (modId) {
          const filterToCheck = `steamcommunity.com##div.workshopItem:has(a[href*="filedetails/?id=${modId}"])`;
          if (collectedFilters.has(filterToCheck)) {
            item.classList.add('mod-hider-filtered-item');
          } else {
            item.classList.remove('mod-hider-filtered-item');
          }
        }
      }
    });
    console.log("Content: Zakończono podświetlanie modów.");
  } else if (response.success && response.filters.length === 0) {
    console.log("Content: Brak filtrów do podświetlenia, usuwam ewentualne podświetlenia.");
    document.querySelectorAll('.mod-hider-filtered-item').forEach(item => {
        item.classList.remove('mod-hider-filtered-item');
    });
  } else {
    console.error("Content: Błąd podczas pobierania filtrów do podświetlenia:", response.error);
  }
}

// Funkcja obsługująca kliknięcia w mody (bez zmian w logice, tylko komunikaty)
document.addEventListener("click", async (event) => {
  if (isHideModeActive && event.button === 0 &&
      !event.target.closest('#show-filters-button') &&
      !event.target.closest('#toggle-hide-mode-button') &&
      !event.target.closest('#steam-workshop-mod-hider-modal')) { // Dodane sprawdzenie dla modala
    console.log("Content: Left click in hide mode detected!");

    let clickedElement = event.target;
    let linkElement = clickedElement.closest("a[href*='/sharedfiles/filedetails/']");
    let workshopItemDiv = null;

    if (linkElement) {
        workshopItemDiv = linkElement.closest(".workshopItem");
    } else {
        workshopItemDiv = clickedElement.closest(".workshopItem");
        if (workshopItemDiv) {
            linkElement = workshopItemDiv.querySelector("a[href*='/sharedfiles/filedetails/']");
        }
    }

    if (linkElement && workshopItemDiv) {
      const url = new URL(linkElement.href);
      const modId = url.searchParams.get("id");

      if (modId) {
        const originalHref = linkElement.href;
        linkElement.removeAttribute('href');
        linkElement.style.pointerEvents = 'none';

        event.preventDefault();
        event.stopImmediatePropagation();
        console.log("Content: Domyślne zachowanie ZAPOBIEGNIĘTE (przez usunięcie href i stopPropagation).");

        const filter = `steamcommunity.com##div.workshopItem:has(a[href*="filedetails/?id=${modId}"])`;

        try {
          const responseCheck = await sendMessageToBackground("getCollectedFilters");
          if (responseCheck.success && responseCheck.filters.includes(filter)) {
            const responseRemove = await sendMessageToBackground("removeFilter", { filter: filter });
            if (responseRemove.success) {
              console.log("Content: " + responseRemove.message);
              workshopItemDiv.classList.remove('mod-hider-filtered-item');
            } else {
              console.error("Content: Błąd podczas usuwania filtra:", responseRemove.error);
              alert("Błąd podczas usuwania filtra: " + responseRemove.error);
            }
          } else {
            const responseAdd = await sendMessageToBackground("addFilter", { filter: filter });
            if (responseAdd.success) {
              console.log("Content: " + responseAdd.message);
              workshopItemDiv.classList.add('mod-hider-filtered-item');
            } else {
              console.error("Content: Błąd podczas dodawania filtra:", responseAdd.error);
              alert("Błąd podczas dodawania filtra: " + responseAdd.error);
            }
          }
        } catch (error) {
          console.error("Content: Krytyczny błąd podczas dodawania/usuwania filtra:", error);
          alert("Krytyczny błąd podczas dodawania/usuwania filtra. Sprawdź konsolę.");
        } finally {
          setTimeout(() => {
            if (originalHref) {
              linkElement.href = originalHref;
            }
            linkElement.style.pointerEvents = 'auto';
            console.log("Content: Przywrócono href i pointerEvents.");
            highlightFilteredMods();
          }, 100);
        }

      } else {
        console.warn("Content: Nie można znaleźć ID moda z linkElement:", linkElement);
      }
    } else {
      console.warn("Content: Kliknięty element nie jest częścią diva przedmiotu warsztatu ani bezpośrednim linkiem do szczegółów moda:", clickedElement);
    }
  }
}, true);

// Logowanie, że content script się uruchomił
console.log("Content script is running on Steam Workshop page.");

// === INICJALIZACJA: Wywołujemy nowe funkcje przy starcie skryptu ===
injectCSS(); // Wstrzyknij style
createActionButtons();

// === Nowość: Używamy MutationObserver do podświetlania dynamicznie ładowanych modów ===
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            highlightFilteredMods();
        }
    }
});

// Rozpocznij obserwowanie zmian w body dokumentu
observer.observe(document.body, { childList: true, subtree: true });

// Ważne: Podświetl mody, które są już na stronie po załadowaniu
highlightFilteredMods();