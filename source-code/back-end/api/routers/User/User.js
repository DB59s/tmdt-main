const express = require('express');
const router = express.Router();

const UserControllers = require('../../controllers/User/User.controller');
const {validateEditUser} = require('../../../validate/validateEdit');
const roleMiddleware = require('../../../middleware/roleMiddleware');
const authMiddleware = require('../../../middleware/authMiddleware');

const { validateManyUser } = require('../../../validate/validateEditMany');
router.get('/', UserControllers.User);

router.get('/detail/:id',authMiddleware() , UserControllers.getUserById);

// router.post('/add',validateRegister, checkValidationResults ,authMiddleware(),roleMiddleware(["1"]),permissionBlogMiddleware("add"), UserControllers.addUser);

router.post('/add', UserControllers.addUser);


router.patch('/update/:id',authMiddleware(),validateEditUser, UserControllers.editUser);

router.delete('/delete/:id',authMiddleware(), roleMiddleware(["0"])  ,UserControllers.deleteUser);

router.delete('/delete', authMiddleware(), roleMiddleware(["0"]), UserControllers.deleteManyUser);

router.patch('/update', authMiddleware(), roleMiddleware(["0"]),validateManyUser ,UserControllers.editManyUser);

module.exports = router;
