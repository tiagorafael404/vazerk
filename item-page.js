(function () {
  if (window.__vwGolfItemPageLoaded) {
    return;
  }
  window.__vwGolfItemPageLoaded = true;

  var currentDetailItem = null;

  function bindGalleryClick() {
    var galleryItems = document.querySelectorAll(".gallery-item");
    var mainPhoto = document.getElementById("main_photo");

    if (!galleryItems.length || !mainPhoto) {
      return;
    }

    galleryItems.forEach(function (item) {
      item.addEventListener("click", function () {
        var newImage = item.getAttribute("photo");

        if (currentDetailItem) {
          if (item.id === "photo1" && currentDetailItem.image) {
            newImage = currentDetailItem.image;
          } else if (item.id === "photo2" && currentDetailItem.image2) {
            newImage = currentDetailItem.image2;
          } else if (item.id === "photo3" && currentDetailItem.image3) {
            newImage = currentDetailItem.image3;
          } else if (item.id === "photo4" && currentDetailItem.image4) {
            newImage = currentDetailItem.image4;
          } else if (item.id === "photo5" && currentDetailItem.image5) {
            newImage = currentDetailItem.image5;
          } else if (item.id === "photo6" && currentDetailItem.image6) {
            newImage = currentDetailItem.image6;
          }
        }

        if (newImage) {
          var normalizedImage = new URL(newImage, getItemsJsonUrl()).href;
          mainPhoto.style.backgroundImage = "url('" + normalizedImage + "')";
        }
      });
    });
  }

  function getItemsJsonUrl() {
    var documentScript = document.currentScript || document.querySelector('script[src$="item-page.js"]');
    if (documentScript && documentScript.src) {
      return new URL("items.json", documentScript.src).href;
    }

    return "items.json";
  }

  function loadProductItemsFromJson() {
    var itemsUrl = getItemsJsonUrl();

    fetch(itemsUrl)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Nao foi possivel carregar items.json: " + response.status);
        }

        return response.json();
      })
      .then(function (items) {
        var itemsById = new Map();
        var itemsByUrl = new Map();
        var currentGolf = window.location.pathname.includes("golf3") ? 3
          : window.location.pathname.includes("golf4") ? 4
          : window.location.pathname.includes("golf5") ? 5
          : window.location.pathname.includes("golf6") ? 6
          : null;

        var filteredItems = currentGolf === null
          ? items
          : items.filter(function (item) {
            return item.golf === currentGolf;
          });

        filteredItems.forEach(function (item) {
          if (item.id !== undefined) {
            itemsById.set(String(item.id), item);
          }

          if (item.url) {
            itemsByUrl.set(item.url, item);
          }
        });

        var productsContainer = document.querySelector(".products");
        var productsList = productsContainer ? productsContainer.querySelector("ul") : null;

        if (productsContainer && !productsList) {
          productsList = document.createElement("ul");
          productsContainer.appendChild(productsList);
        }

        if (productsList) {
          while (productsList.children.length < filteredItems.length) {
            var li = document.createElement("li");
            li.innerHTML =
              '<a class="product-link" href="#">'
              + '<div class="image"></div>'
              + "</a>"
              + '<div class="info">'
              + '<div class="name"><a class="name-link" href="#"></a></div>'
              + '<div class="price"><a class="price-text"></a></div>'
              + "</div>";
            productsList.appendChild(li);
          }

          while (productsList.children.length > filteredItems.length) {
            productsList.removeChild(productsList.lastElementChild);
          }

          Array.from(productsList.children).forEach(function (li, index) {
            var item = filteredItems[index] || null;

            if (!item) {
              li.style.display = "none";
              return;
            }

            li.style.display = "";

            var productLink = li.querySelector(".product-link");
            var nameLink = li.querySelector(".name-link");
            var priceText = li.querySelector(".price-text");
            var imageDiv = li.querySelector(".image");

            if (productLink) {
              productLink.href = item.url || "#";
            }

            if (nameLink) {
              nameLink.href = item.url || "#";
              nameLink.textContent = item.name || "";
            }

            if (priceText) {
              priceText.textContent = item.price || "";
            }

            if (imageDiv && item.image) {
              imageDiv.style.backgroundImage = "url('" + item.image + "')";
            }
          });
        }

        function normalizeItemReference(reference) {
          if (reference === undefined || reference === null) {
            return "";
          }

          return String(reference)
            .trim()
            .split("#")[0]
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");
        }

        function getItemByReference(reference) {
          if (reference === undefined || reference === null) {
            return null;
          }

          var normalizedReference = normalizeItemReference(reference);
          if (!normalizedReference) {
            return null;
          }

          if (itemsById.has(String(normalizedReference))) {
            return itemsById.get(String(normalizedReference));
          }

          if (itemsByUrl.has(normalizedReference)) {
            return itemsByUrl.get(normalizedReference);
          }

          for (var _i = 0, _arr = Array.from(itemsByUrl.entries()); _i < _arr.length; _i++) {
            var _entry = _arr[_i];
            var itemUrl = _entry[0];
            var item = _entry[1];
            var normalizedItemUrl = normalizeItemReference(itemUrl);

            if (normalizedItemUrl === normalizedReference) {
              return item;
            }

            var queryMatch = normalizedItemUrl.match(/(?:^|[?&])item=([^&]+)/);
            if (queryMatch && queryMatch[1] === normalizedReference) {
              return item;
            }
          }

          return null;
        }

        function getDetailItemFromPageUrl() {
          var bodyUrl = document.body.dataset.itemUrl;
          var bodyItem = getItemByReference(bodyUrl);
          if (bodyItem) {
            return bodyItem;
          }

          var params = new URLSearchParams(window.location.search);
          ["item", "url", "product", "id"].forEach(function (key) {
            if (currentDetailItem) {
              return;
            }

            var value = params.get(key);
            var matchedItem = getItemByReference(value);
            if (matchedItem) {
              currentDetailItem = matchedItem;
            }
          });

          if (currentDetailItem) {
            return currentDetailItem;
          }

          var path = window.location.pathname.replace(/\\/g, "/").replace(/^\/+/, "");
          return getItemByReference(path);
        }

        var detailItem = getDetailItemFromPageUrl();
        currentDetailItem = detailItem;

        if (!detailItem) {
          var productNameFallback = document.querySelector(".product_name a");
          var productPriceFallback = document.querySelector(".product_price a");
          var optionsTitleFallback = document.querySelector(".options_title a");

          if (productNameFallback) {
            productNameFallback.textContent = "Product not available";
          }

          if (productPriceFallback) {
            productPriceFallback.textContent = "-";
          }

          if (optionsTitleFallback) {
            optionsTitleFallback.textContent = "Unavailable";
          }

          var mainPhotoFallback = document.getElementById("main_photo");
          if (mainPhotoFallback) {
            mainPhotoFallback.style.backgroundImage = "none";
          }

          return;
        }

        var productName = document.querySelector(".product_name a");
        var productPrice = document.querySelector(".product_price a");
        var productDescription = document.querySelector(".product_description a");
        var optionsTitle = document.querySelector(".options_title a");
        var buyLink = document.getElementById("buyLink");
        var optionsList = document.querySelector(".options_list ul");

        if (productName) {
          productName.textContent = detailItem.name || productName.textContent;
        }

        if (productPrice) {
          productPrice.textContent = detailItem.price || productPrice.textContent;
        }

        if (productDescription) {
          productDescription.textContent = detailItem.description || "";
        }

        if (optionsTitle) {
          if (typeof detailItem.select === "string") {
            optionsTitle.textContent = detailItem.select;
          } else {
            optionsTitle.textContent = (detailItem.select && detailItem.select.label) || optionsTitle.textContent;
          }
        }

        if (buyLink) {
          buyLink.href = detailItem.buy || buyLink.getAttribute("href") || "#";
        }

        if (optionsList && detailItem.select && Array.isArray(detailItem.select.options) && detailItem.select.options.length > 0) {
          optionsList.innerHTML = "";
          detailItem.select.options.forEach(function (option, index) {
            var li = document.createElement("li");
            li.id = String(option.id);

            var anchor = document.createElement("a");
            anchor.href = "#";
            anchor.textContent = option.name || ("Option " + option.id);

            li.appendChild(anchor);
            optionsList.appendChild(li);

            li.addEventListener("click", function (event) {
              event.preventDefault();
              optionsList.querySelectorAll("li").forEach(function (el) {
                el.classList.remove("selected");
              });
              li.classList.add("selected");

              if (buyLink) {
                buyLink.href = option.url || detailItem.buy || buyLink.getAttribute("href") || "#";
              }
            });

            if (index === 0) {
              li.classList.add("selected");
              if (buyLink) {
                buyLink.href = option.url || detailItem.buy || buyLink.getAttribute("href") || "#";
              }
            }
          });
        }

        var mainPhotoElement = document.getElementById("main_photo");
        if (mainPhotoElement && detailItem.image) {
          var photoUrl = new URL(detailItem.image, itemsUrl).href;
          mainPhotoElement.style.backgroundImage = "url('" + photoUrl + "')";
        }

        ["image", "image2", "image3", "image4", "image5", "image6"].forEach(function (key, index) {
          var imageValue = detailItem[key];
          if (!imageValue) {
            return;
          }

          var photo = document.getElementById("photo" + (index + 1));
          if (!photo) {
            return;
          }

          var imageUrl = new URL(imageValue, itemsUrl).href;
          photo.style.backgroundImage = "url('" + imageUrl + "')";
          photo.setAttribute("photo", imageValue);
        });
      })
      .catch(function (error) {
        console.error("Erro ao carregar items.json:", error);
      });
  }

  function initializeItemPage() {
    bindGalleryClick();
    loadProductItemsFromJson();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeItemPage);
  } else {
    initializeItemPage();
  }
})();
