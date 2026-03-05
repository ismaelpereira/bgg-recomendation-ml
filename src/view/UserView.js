import { View } from "./View.js";

export class UserView extends View {
   #userSelect = document.querySelector("#userSelect");
   #userAge = document.querySelector("#userAge");
   #favoriteGamesList = document.querySelector("#favoriteGamesList");

   #boardgamesTemplate;
   #onUserSelect;
   #onBoardgameRemove;
   #favoriteGamesElements = [];

   constructor() {
      super();
      this.init();
   }

   htmlEncode(str) {
      return String(str)
         .replace(/&/g, "&amp;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#39;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;");
   }

   async init() {
      this.#boardgamesTemplate = await this.loadTemplate(
         "./src/view/templates/favorite-boardgames.html",
      );
      this.attachUserSelectListener();
   }

   registerUserSelectCallback(callback) {
      this.#onUserSelect = callback;
   }

   registerGameRemoveCallback(callback) {
      this.#onBoardgameRemove = callback;
   }

   renderUserOptions(users) {
      const options = users
         .map((user) => {
            return `<option value="${user.id}">${user.name}</option>`;
         })
         .join("");

      this.#userSelect.innerHTML += options;
   }

   renderUserDetails(user) {
      this.#userAge.value = user.age;
   }

   renderFavoriteGames(favoriteGames) {
      if (!this.#boardgamesTemplate) return;

      if (!favoriteGames || favoriteGames.length === 0) {
         this.#favoriteGamesList.innerHTML = "<p>No favorite games found.</p>";
         return;
      }

      const html = favoriteGames
         .map((boardgame) => {

            return this.replaceTemplate(this.#boardgamesTemplate, {
               name: boardgame.name,
               play_time: boardgame.play_time,
               complexity_average: boardgame.complexity_average,
               boardgame: this.htmlEncode(JSON.stringify(boardgame)),
            });
         })
         .join("");

      this.#favoriteGamesList.innerHTML = html;
      this.attachFavoriteGamesClickHandlers();
   }

   addFavoriteGame(favoriteGame) {
      if (
         this.#favoriteGamesList.innerHTML.includes("No favorite games found")
      ) {
         this.#favoriteGamesList.innerHTML = "";
      }

      const purchaseHtml = this.replaceTemplate(this.#boardgamesTemplate, {
         ...favoriteGame,
         boardgame: this.htmlEncode(JSON.stringify(favoriteGame)),
      });

      this.#favoriteGamesList.insertAdjacentHTML("afterbegin", purchaseHtml);

      const newFavoriteGame =
         this.#favoriteGamesList.firstElementChild.querySelector(
            ".favorite-games",
         );
      newFavoriteGame.classList.add("favorite-games-highlight");

      setTimeout(() => {
         newFavoriteGame.classList.remove("favorite-games-highlight");
      }, 1000);

      this.attachFavoriteGamesClickHandlers();
   }

   attachUserSelectListener() {
      this.#userSelect.addEventListener("change", (event) => {
         const userId = event.target.value ? Number(event.target.value) : null;

         if (userId) {
            if (this.#onUserSelect) {
               this.#onUserSelect(userId);
            }
         } else {
            this.#userAge.value = "";
            this.#favoriteGamesList.innerHTML = "";
         }
      });
   }

   attachFavoriteGamesClickHandlers() {
      this.#favoriteGamesElements = [];

      const favoriteGamesElements =
         document.querySelectorAll(".favorite-games");
      favoriteGamesElements.forEach((favoriteGameElement) => {
         this.#favoriteGamesElements.push(favoriteGameElement);

         favoriteGameElement.onclick = (event) => {
            const boardgame = JSON.parse(favoriteGameElement.dataset.boardgame);
            const userId = this.getSelectedUserId();
            const element = favoriteGameElement.closest(".col-md-6");

            this.#onBoardgameRemove({ element, userId, boardgame });

            element.style.transition = "opacity 0.5s ease";
            element.style.opacity = "0";

            setTimeout(() => {
               element.remove();

               if (document.querySelectorAll(".favorite-games").length === 0) {
                  this.renderFavoriteGames([]);
               }
            }, 500);
         };
      });
   }

   getSelectedUserId() {
      return this.#userSelect.value ? Number(this.#userSelect.value) : null;
   }
}
