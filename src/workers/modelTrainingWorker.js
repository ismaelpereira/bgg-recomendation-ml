import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
import { workerEvents } from "../events/constants.js";

console.log("Model training worker initialized");
let _globalCtx = {};
let _model = null;
const WEIGHTS = {
   complexity_average: 0.4,
   play_time: 0.3,
   domains: 0.2,
   age: 0.1,
};

const normalize = (value, min, max) => (value - min) / (max - min || 1);

function makeContext(boardgames, users) {
   const ages = users.map((u) => u.age);

   const playTimes = boardgames.map((boardgame) => boardgame.play_time);

   const minAge = Math.min(...ages);
   const maxAge = Math.max(...ages);

   const minPlayTimes = Math.min(...playTimes);
   const maxPlayTimes = Math.max(...playTimes);

   const complexityAvg = boardgames.map(
      (boardgame) => boardgame.complexity_average,
   );

   const minComplexity = Math.min(...complexityAvg);
   const maxComplexity = Math.max(...complexityAvg);

   const domains = [...new Set(boardgames.map((b) => b.domains))];

   const domainsIndex = Object.fromEntries(
      domains.map((domain, index) => {
         return [domain, index];
      }),
   );

   // compute average of age of products bought to help personalize
   const midAge = (minAge + maxAge) / 2;
   const ageSums = {};
   const ageCounts = {};

   users.forEach((user) => {
      user.favorite_games.forEach((p) => {
         ageSums[p.name] = (ageSums[p.name] || 0) + user.age;
         ageCounts[p.name] = (ageCounts[p.name] || 0) + 1;
      });
   });

   const gameAvgAgeNorm = Object.fromEntries(
      boardgames.map((boardgame) => {
         const avg = ageCounts[boardgame.name]
            ? ageSums[boardgame.name] / ageCounts[boardgame.name]
            : midAge;

         return [boardgame.name, normalize(avg, minAge, maxAge)];
      }),
   );

   return {
      boardgames,
      users,
      playTimes,
      minPlayTimes,
      maxPlayTimes,
      complexityAvg,
      minComplexity,
      maxComplexity,
      domains,
      domainsIndex,
      gameAvgAgeNorm,
      midAge,
      minAge,
      maxAge,
      numDomains: domains.length,
      // playtime + age + complexityAvg   + domains
      dimentions: 3 + domains.length,
   };
}

const oneHotWeighted = (index, length, weight) =>
   tf.oneHot(index, length).cast("float32").mul(weight);

function encodeBoardgame(boardgame, context) {
   // normalizing data to be 0 to 1 and aplying the recommendation weight

   const playTime = tf.tensor1d([
      normalize(
         boardgame.play_time,
         context.minPlayTimes,
         context.maxPlayTimes,
      ) * WEIGHTS.play_time,
   ]);

   const complexityAvgs = tf.tensor1d([
      normalize(
         boardgame.complexity_average,
         context.minComplexity,
         context.maxComplexity,
      ) * WEIGHTS.complexity_average,
   ]);
   const userAge = tf.tensor1d([context.gameAvgAgeNorm[boardgame.name] ?? 0.5]);

   const domains = oneHotWeighted(
      context.domainsIndex[boardgame.domains],
      context.numDomains,
      WEIGHTS.domains,
   );

   return tf.concat1d([playTime, complexityAvgs, userAge, domains]);
}

function encodeUser(user, context) {
   if (user.favorite_games.length) {
      return tf
         .stack(
            user.favorite_games.map((favorite_game) =>
               encodeBoardgame(favorite_game, context),
            ),
         )
         .mean(0)
         .reshape([1, context.dimentions]);
   }

   return tf
      .concat1d([
         tf.zeros([1]), // play_time ignored
         tf.zeros([1]), // complexityAvg ignored
         tf.tensor1d([
            normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age,
         ]), // userAge
         tf.zeros([context.numDomains]), // domains
      ])
      .reshape([1, context.dimentions]);
}

function createTrainingData(context) {
   const inputs = [];
   const labels = [];
   context.users
      .filter((u) => u.favorite_games.length)
      .forEach((user) => {
         const userVector = encodeUser(user, context).dataSync();
         context.boardgames.forEach((boardgame) => {
            const boardgameVector = encodeBoardgame(
               boardgame,
               context,
            ).dataSync();
            const label = user.favorite_games.some((favorite_game) =>
               favorite_game.name === boardgame.name ? 1 : 0,
            );
            // combine user + boardgame
            inputs.push([...userVector, ...boardgameVector]);
            labels.push(label);
         });
      });

   return {
      xs: tf.tensor2d(inputs),
      ys: tf.tensor2d(labels, [labels.length, 1]),
      inputDimention: context.dimentions * 2,
      // userVector + productVector
   };
}

async function configureNeuralNetAndTrain(trainData) {
   const model = tf.sequential();
   model.add(
      tf.layers.dense({
         inputShape: [trainData.inputDimention],
         units: 256,
         activation: "relu",
      }),
   );

   model.add(
      tf.layers.dense({
         units: 128,
         activation: "relu",
      }),
   );

   model.add(
      tf.layers.dense({
         units: 64,
         activation: "relu",
      }),
   );

   model.add(
      tf.layers.dense({
         units: 1,
         activation: "sigmoid",
      }),
   );

   model.compile({
      optimizer: tf.train.adam(0.01),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
   });

   await model.fit(trainData.xs, trainData.ys, {
      epochs: 100,
      batchSize: 32,
      shuffle: true,
      callbacks: {
         onEpochEnd: (epoch, logs) => {
            postMessage({
               type: workerEvents.trainingLog,
               epoch: epoch,
               loss: logs.loss,
               accuracy: logs.acc,
            });
         },
      },
   });

   return model;
}

async function trainModel({ users }) {
   console.log("Training model with users:", users);

   postMessage({
      type: workerEvents.progressUpdate,
      progress: { progress: 50 },
   });
   const boardgames = await (await fetch("/data/bgg.json")).json();
   const context = makeContext(boardgames, users);

   context.boardgameVectors = boardgames.map((boardgame) => ({
      name: boardgame.name,
      meta: { ...boardgame },
      vector: encodeBoardgame(boardgame, context).dataSync(),
   }));

   _globalCtx = context;

   const trainData = createTrainingData(context);
   _model = await configureNeuralNetAndTrain(trainData);

   postMessage({
      type: workerEvents.progressUpdate,
      progress: { progress: 100 },
   });
   postMessage({ type: workerEvents.trainingComplete });
}
function recommend(user, ctx) {
   if (!_model) {
      return;
   }
   const userVector = encodeUser(user, ctx).dataSync();

   const inputs = ctx.boardgameVectors.map(({ vector }) => {
      return [...userVector, ...vector];
   });


   const inputTensor = tf.tensor2d(inputs);

   const predictions = _model.predict(inputTensor);

   const scores = predictions.dataSync();

   console.log("will recommend for user:", user);

   const recommendations = ctx.boardgameVectors.map((item, index) => ({
      ...item.meta,
      name: item.name,
      score: scores[index],
   }));

   const sortedItems = recommendations
      .filter(
         (rec) => !user.favorite_games.some((fav) => fav.name === rec.name),
      )
      .sort((a, b) => b.score - a.score);

   postMessage({
      type: workerEvents.recommend,
      user,
      recommendations: sortedItems,
   });
}

const handlers = {
   [workerEvents.trainModel]: trainModel,
   [workerEvents.recommend]: (d) => recommend(d.user, _globalCtx),
};

self.onmessage = (e) => {
   const { action, ...data } = e.data;
   if (handlers[action]) handlers[action](data);
};
