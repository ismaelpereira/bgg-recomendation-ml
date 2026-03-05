import { View } from "./View.js";

export class BoardgameView extends View {
   // DOM elements
   #boardgameList = document.querySelector("#boardgameList");

   #buttons;
   // Templates and callbacks
   #boardgameTemplate;
   #onAddBoardgame;

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
      this.#boardgameTemplate = await this.loadTemplate(
         "./src/view/templates/boardgame-card.html",
      );
   }

   onUserSelected(user) {
      // Enable buttons if a user is selected, otherwise disable them
      this.setButtonsState(user.id ? false : true);
   }

   registerAddBoardgameCallback(callback) {
      this.#onAddBoardgame = callback;
   }

   render(boardgames, disableButtons = true) {
      if (!this.#boardgameTemplate) return;
      const html = boardgames
         .map((boardgame) => {
            return this.replaceTemplate(this.#boardgameTemplate, {
               ID: boardgame.ID,
               name: boardgame.name,
               play_time: boardgame.play_time,
               complexity_average: boardgame.complexity_average,
               domains: boardgame.domains,
               boardgame: this.htmlEncode(JSON.stringify(boardgame)),
            });
         })
         .join("");

      this.#boardgameList.innerHTML = html;
      this.attachAddButtonListeners();

      // Disable all buttons by default
      this.setButtonsState(disableButtons);
   }

   setButtonsState(disabled) {
      if (!this.#buttons) {
         this.#buttons = document.querySelectorAll(".add-game-btn");
      }
      this.#buttons.forEach((button) => {
         button.disabled = disabled;
      });
   }

   attachAddButtonListeners() {
      this.#buttons = document.querySelectorAll(".add-game-btn");
      this.#buttons.forEach((button) => {
         button.addEventListener("click", (event) => {
            const boardgame = JSON.parse(button.dataset.boardgame);
            const originalText = button.innerHTML;

            if (this.#onAddBoardgame) return;

            button.innerHTML = '<i class="bi bi-check-circle-fill"></i> Added';
            button.classList.remove("btn-primary");
            button.classList.add("btn-success");
            setTimeout(() => {
               button.innerHTML = originalText;
               button.classList.remove("btn-success");
               button.classList.add("btn-primary");
            }, 500);
            this.#onAddBoardgame(boardgame, button);
         });
      });
   }
}
