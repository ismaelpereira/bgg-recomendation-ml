export class BoardgameService {
   async getBoardgames() {
      const response = await fetch("./data/bgg.json");
      return await response.json();
   }

   async getBoardgameById(id) {
      const boardgames = await this.getBoardgames();
      return boardgames.find((boardgame) => boardgame.ID === id);
   }

   async getProductsByIds(ids) {
      const boardgames = await this.getBoardgames();
      return boardgames.filter((boardgame) => ids.includes(boardgame.ID));
   }
}
