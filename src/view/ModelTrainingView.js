import { View } from "./View.js";

export class ModelView extends View {
   #trainModelBtn = document.querySelector("#trainModelBtn");
   #boardgamesArrow = document.querySelector("#boardgamesArrow");
   #boardgamesDiv = document.querySelector("#boardgamesDiv");
   #allUsersFavoriteGamesList = document.querySelector("#favoriteGamesList");
   #runRecommendationBtn = document.querySelector("#runRecommendationBtn");
   #onTrainModel;
   #onRunRecommendation;

   constructor() {
      super();
      this.attachEventListeners();
   }

   registerTrainModelCallback(callback) {
      this.#onTrainModel = callback;
   }
   registerRunRecommendationCallback(callback) {
      this.#onRunRecommendation = callback;
   }

   attachEventListeners() {
      this.#trainModelBtn.addEventListener("click", () => {
         this.#onTrainModel();
      });
      this.#runRecommendationBtn.addEventListener("click", () => {
         this.#onRunRecommendation();
      });

      this.#boardgamesDiv.addEventListener("click", () => {
         const favoriteGamesList = this.#allUsersFavoriteGamesList;

         const isHidden =
            window.getComputedStyle(favoriteGamesList).display === "none";

         if (isHidden) {
            favoriteGamesList.style.display = "block";
            this.#boardgamesArrow.classList.remove("bi-chevron-down");
            this.#boardgamesArrow.classList.add("bi-chevron-up");
         } else {
            favoriteGamesList.style.display = "none";
            this.#boardgamesArrow.classList.remove("bi-chevron-up");
            this.#boardgamesArrow.classList.add("bi-chevron-down");
         }
      });
   }
   enableRecommendButton() {
      this.#runRecommendationBtn.disabled = false;
   }
   updateTrainingProgress(progress) {
      this.#trainModelBtn.disabled = true;
      this.#trainModelBtn.innerHTML =
         '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Training...';

      if (progress.progress === 100) {
         this.#trainModelBtn.disabled = false;
         this.#trainModelBtn.innerHTML = "Train Recommendation Model";
      }
   }

   renderAllUsersPurchases(users) {
      const html = users
         .map((user) => {
            const favoriteGamesHtml = user.favorite_games
               .map((favorite_games) => {
                  return `<span class="badge bg-light text-dark me-1 mb-1">${favorite_games.name}</span>`;
               })
               .join("");

            return `
                <div class="favorite-games-summary">
                    <h6>${user.name} (Age: ${user.age})</h6>
                    <div class="purchases-badges">
                        ${favoriteGamesHtml || '<span class="text-muted">No Favorite Games</span>'}
                    </div>
                </div>
            `;
         })
         .join("");

      this.#allUsersFavoriteGamesList.innerHTML = html;
   }
}
