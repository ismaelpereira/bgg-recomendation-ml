export class BoardgameController {
   #boardgameView;
   #currentUser = null;
   #events;
   #boardgameService;
   constructor({ boardgameView, events, boardgameService }) {
      this.#boardgameView = boardgameView;
      this.#boardgameService = boardgameService;
      this.#events = events;
      this.init();
   }

   static init(deps) {
      return new BoardgameController(deps);
   }

   async init() {
      this.setupCallbacks();
      this.setupEventListeners();
      const boardgames = await this.#boardgameService.getBoardgames();
      this.#boardgameView.render(boardgames, true);
   }

   setupEventListeners() {
      this.#events.onUserSelected((user) => {
         this.#currentUser = user;
         this.#boardgameView.onUserSelected(user);
         this.#events.dispatchRecommend(user);
      });

      this.#events.onRecommendationsReady(({ recommendations }) => {
         this.#boardgameView.render(recommendations, false);
      });
   }

   setupCallbacks() {
      this.#boardgameView.registerAddBoardgameCallback(
         this.handleAddFavoriteGame.bind(this),
      );
   }

   async handleAddFavoriteGame(boardgame) {
      const user = this.#currentUser;
      this.#events.dispatchBoardgameAdded({ user, boardgame });
   }
}
