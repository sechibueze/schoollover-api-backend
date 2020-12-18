const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const AuthUser = require('../middlewares/AuthUser');
const { uploads } = require('../middlewares/uploadStorage')
const { 
  createProject,
  updateProjectById,
  getProjects,
  deleteProject,
  addBudgetByProjectId,
  updateBudgetById,
  removeBudgetItem,
} = require('../controllers/ProjectControllers');

/*** Forward all requests to /api/projects here */

/***
 * @route POST /api/projects
 * @desc Allow authenticated users to create new project
 * @access private
 */
router.post('/', 
  AuthUser, 
  uploads.single('projectImage'),
  [
    check('title', 'Title is required').notEmpty(),
    check('caption', 'Project caption is required').notEmpty(),
    // check('image', 'Project image is required').notEmpty(),
    check('description', 'Project description is required').notEmpty(),
    check('due_date', 'A due date is required').notEmpty(),
  ], 
  createProject);


/***
 * @route PUT /api/projects?id=<project._id>
 * @desc Allow authenticated users to updated their project
 * @access private
 */
router.put('/', AuthUser, updateProjectById );

/***
 * @route PUT /api/projects/:id/budgets
 * @desc Allow authenticated users to create their project budget
 * @access private
 */
router.put('/:id/budgets', [check('budget', 'Budget is required').isArray()], AuthUser, addBudgetByProjectId );

/***
 * @route PUT /api/projects/:projectId/budgets/:budgetId
 * @desc Allow authenticated users to updated their project budget
 * @access private
 */
router.put('/:projectId/budgets/:budgetId', 
  [
    check('item_name', 'Item name is required').notEmpty(),
    check('quantity', 'Quantity is required').notEmpty(),
    check('unit_cost', 'Unit cost is required').notEmpty(),
  ], 
  AuthUser, updateBudgetById );

  /***
 * @route DELETE /api/projects/:projectId/budgets/:budgetId
 * @desc Allow authenticated users to remove their project budget item
 * @access private
 */
router.delete('/:projectId/budgets/:budgetId', 
  AuthUser, removeBudgetItem );


/***
 * @route GET /api/projects
 * @desc Allow authenticated users to see projects
 * @access private
 */
router.get('/', AuthUser, getProjects );

/***
 * @route DELETE /api/projects
 * @desc Allow authenticated ADMIN to delete project
 * @access private
 */
router.delete('/', AuthUser, deleteProject );

  module.exports = router;