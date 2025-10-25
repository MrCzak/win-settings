// background.js (Ten skrypt działa w tle rozszerzenia)

chrome.runtime.onInstalled.addListener(() => {
  console.log("Steam Workshop Mod Hider extension installed.");
});

// Cała sekcja nasłuchiwania na komendy (skróty klawiszowe) została usunięta
// chrome.commands.onCommand.addListener((command) => {
//   if (command === "activate_hide_mode") {
//     console.log("Background: Aktywowanie trybu ukrywania za pomocą skrótu klawiszowego.");
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (tabs.length > 0 && tabs[0].url.startsWith("https://steamcommunity.com/")) {
//         chrome.tabs.sendMessage(tabs[0].id, { action: "toggleHideMode" })
//           .catch(error => {
//             if (error.message.includes("Could not establish connection. Receiving end does not exist.")) {
//               console.warn("Background: Content script nie jest aktywny na tej stronie. Skrót Ctrl+Shift+U działa tylko na stronach Steam Workshop.");
//             } else {
//               console.error("Background: Błąd podczas wysyłania wiadomości toggleHideMode:", error);
//             }
//           });
//       } else {
//         console.warn("Background: Skrót Ctrl+Shift+U działa tylko na stronach Steam Workshop. Brak aktywnej zakładki Steam Workshop.");
//       }
//     });
//   }
// });

// Nasłuchiwanie na wiadomości od content scriptów
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === "addFilter") {
        const filterToAdd = request.filter;
        console.log("Background: Otrzymano filtr do dodania:", filterToAdd);

        const data = await new Promise((resolve, reject) => {
          chrome.storage.local.get({ collectedFilters: [] }, (result) => {
            if (chrome.runtime.lastError) {
              return reject(new Error("Storage get error: " + chrome.runtime.lastError.message));
            }
            resolve(result);
          });
        });

        const filters = new Set(data.collectedFilters);
        if (!filters.has(filterToAdd)) {
            filters.add(filterToAdd);
            await new Promise((resolve, reject) => {
              chrome.storage.local.set({ collectedFilters: Array.from(filters) }, () => {
                if (chrome.runtime.lastError) {
                  return reject(new Error("Storage set error: " + chrome.runtime.lastError.message));
                }
                resolve();
              });
            });
            console.log("Background: Filtr dodany do kolekcji:", filterToAdd);
            sendResponse({ success: true, message: "Filtr dodany do biblioteki!" });
        } else {
            console.log("Background: Filtr już istnieje, pomijam dodawanie:", filterToAdd);
            sendResponse({ success: false, message: "Filtr już znajduje się w bibliotece!" });
        }


      } else if (request.action === "removeFilter") {
        const filterToRemove = request.filter;
        console.log("Background: Otrzymano filtr do usunięcia:", filterToRemove);

        const data = await new Promise((resolve, reject) => {
          chrome.storage.local.get({ collectedFilters: [] }, (result) => {
            if (chrome.runtime.lastError) {
              return reject(new Error("Storage get error: " + chrome.runtime.lastError.message));
            }
            resolve(result);
          });
        });

        let filters = new Set(data.collectedFilters);
        if (filters.delete(filterToRemove)) {
          await new Promise((resolve, reject) => {
            chrome.storage.local.set({ collectedFilters: Array.from(filters) }, () => {
              if (chrome.runtime.lastError) {
                return reject(new Error("Storage set error: " + chrome.runtime.lastError.message));
              }
              resolve();
            });
          });
          console.log("Background: Filtr usunięty z kolekcji:", filterToRemove);
          sendResponse({ success: true, message: "Filtr usunięty z biblioteki!" });
        } else {
          console.log("Background: Filtr nie znaleziono w kolekcji:", filterToRemove);
          sendResponse({ success: false, message: "Filtr nie znaleziono w bibliotece!" });
        }

      } else if (request.action === "getCollectedFilters") {
        console.log("Background: Otrzymano żądanie pobrania filtrów.");
        const data = await new Promise((resolve, reject) => {
          chrome.storage.local.get({ collectedFilters: [] }, (result) => {
            if (chrome.runtime.lastError) {
              return reject(new Error("Storage get error: " + chrome.runtime.lastError.message));
            }
            resolve(result);
          });
        });

        console.log("Background: Wysyłanie zebranych filtrów:", data.collectedFilters);
        sendResponse({ success: true, filters: data.collectedFilters });

      } else if (request.action === "clearCollectedFilters") {
        console.log("Background: Otrzymano żądanie wyczyszczenia filtrów.");
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({ collectedFilters: [] }, () => {
            if (chrome.runtime.lastError) {
              return reject(new Error("Storage set error: " + chrome.runtime.lastError.message));
            }
            resolve();
          });
        });

        console.log("Background: Wszystkie filtry wyczyszczone.");
        sendResponse({ success: true, message: "Wszystkie filtry zostały wyczyszczone." });
      }
    } catch (error) {
      console.error("Background: Błąd w obsłudze wiadomości:", error.message);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});