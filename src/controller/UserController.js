export class UserController {
   #userService;
   #userView;
   #events;
   constructor({ userView, userService, events }) {
      this.#userView = userView;
      this.#userService = userService;
      this.#events = events;
   }

   static init(deps) {
      return new UserController(deps);
   }

   async renderUsers(nonTrainedUser) {
      const users = await this.#userService.getDefaultUsers();

      this.#userService.addUser(nonTrainedUser);
      const defaultAndNonTrained = [nonTrainedUser, ...users];

      this.#userView.renderUserOptions(defaultAndNonTrained);
      this.setupCallbacks();
      this.setupBoardgameObserver();

      this.#events.dispatchUsersUpdated({ users: defaultAndNonTrained });
   }

   setupCallbacks() {
      this.#userView.registerUserSelectCallback(
         this.handleUserSelect.bind(this),
      );
      this.#userView.registerGameRemoveCallback(
         this.handleBoardgameRemove.bind(this),
      );
   }

   setupBoardgameObserver() {
      this.#events.onBoardgameAdded(async (...data) => {
         return this.handleBoardgameAdded(...data);
      });
   }

   async handleUserSelect(userId) {
      const user = await this.#userService.getUserById(userId);
      this.#events.dispatchUserSelected(user);
      return this.displayUserDetails(user);
   }

   async handleBoardgameAdded({ user, boardgame }) {
      const updatedUser = await this.#userService.getUserById(user.id);
      updatedUser.favorite_games.push({
         ...boardgame,
      });

      await this.#userService.updateUser(updatedUser);

      const lastFavoriteGame =
         updatedUser.favorite_games[updatedUser.favorite_games.length - 1];
      this.#userView.addFavoriteGame(lastFavoriteGame);
      this.#events.dispatchUsersUpdated({
         users: await this.#userService.getUsers(),
      });
   }

   async handleBoardgameRemove({ userId, boardgame }) {
      const user = await this.#userService.getUserById(userId);
      const index = user.favorite_games.findIndex(
         (item) => item.id === boardgame.ID,
      );

      if (index !== -1) {
         user.favorite_games.splice(index, 1); // directly remove one item at the found index
         await this.#userService.updateUser(user);

         const updatedUsers = await this.#userService.getUsers();
         this.#events.dispatchUsersUpdated({ users: updatedUsers });
      }
   }

   async displayUserDetails(user) {
      if (!user) {
         this.#userView.renderFavoriteGames([]);
         return;
      }
      this.#userView.renderUserDetails(user);
      this.#userView.renderFavoriteGames(user.favorite_games);
   }

   getSelectedUserId() {
      return this.#userView.getSelectedUserId();
   }
}
