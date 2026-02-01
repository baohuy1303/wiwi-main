const express = require("express");
const router = express.Router();
const {
    createItem,
    getItems,
    getItem,
    updateItem,
    deleteItem,
    getItemsBySellerId,
    getAllTickersSoldBySeller,
    getItemsByBuyerId,
    getRandomItems,
    enterRaffle,
    confirmRaffle,
    cancelRaffle,
    endRaffleNotMet,
    extendRaffle,
} = require('../controllers/Items');

router.post('/item/post', createItem);
router.get('/item/get', getItems);
router.get('/item/get/:id', getItem);
router.put('/item/put/:id', updateItem);
router.delete('/item/delete/:id', deleteItem);
router.get('/item/getBySellerId/:sellerId', getItemsBySellerId);
router.get(
    '/item/getAllTickersSoldBySeller/:sellerId',
    getAllTickersSoldBySeller
);
router.get('/item/getByBuyerId/:buyerId', getItemsByBuyerId);
router.get('/item/getRandomItems/:size', getRandomItems);
router.post('/item/enter-raffle', enterRaffle);
router.post('/item/confirm-raffle', confirmRaffle);
router.post('/item/cancel-raffle', cancelRaffle);
router.post('/item/end-raffle-not-met', endRaffleNotMet);
router.post('/item/extend-raffle', extendRaffle);


module.exports = router;