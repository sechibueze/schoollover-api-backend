
const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const { getDataURI } = require('../_helpers/dataURI')
const { cloudinaryUploader } = require('../config/cloudinary.config');


/****Allow authenticated users to create new project */
const createProject = (req, res) => {
    const errorsContainer = validationResult(req);
    if (!errorsContainer.isEmpty()) {
        return res.status(422).json({
        status: false,
        errors: errorsContainer.errors.map(err => err.msg)
        });
    }
    /*** Confirm user is authenticated */
    const currentUserId = req.authUser.id;
    if (!currentUserId) {
        return res.status(401).json({
            status: false,
            error: 'Only authenticated users can create a project'
        })
    }

    if (!req.file) {
        return res.status(400).json({
            status: false,
            error: 'No file found'
        })
    }

    const dataURI = getDataURI(req.file);
    if (!dataURI) {
        return res.status(400).json({
            status: false,
            error: 'Could not process file'
        })
    }
    
    
    const { title, caption,  description, due_date } = req.body;
    const slug = title.toLowerCase().trim().replace(/\s+/g, '-');
    let opts = {
        public_id: `${slug}-${currentUserId}`,
        folder: 'elf/project-images/'
    };

    cloudinaryUploader
        .upload(dataURI, opts)
        .then(result => {
            
            let newProjectData = { 
                owner: currentUserId,
                title,
                slug,
                caption,
                projectImage: { url: result.secure_url, id: result.public_id },
                description,
                due_date,
        
             };
        
            let newProject = new Project(newProjectData);
        
            newProject.save(err => {
                if (err) {
                    return res.status(500).json({
                        status: false,
                        error: 'Internal Server error',
                      
                    })
                }
        
                return res.status(201).json({
                    status: true,
                    message: 'New project created',
                    data: newProject
                })
        
            });
        })
        .catch(err => {
            return res.status(500).json({
                status: false,
                error: 'Internal Server error in uploading project image',
            
            })
        })


};


/****Allow authenticated users to update their project */
const updateProjectById = (req, res) => {
    
    /*** Confirm user is authenticated */
    const currentUserId = req.authUser.id;
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({
            status: false,
            error: 'No id, Invalid request'
        })
    }
    let filter = {
        owner: currentUserId,
        _id: id
    }
    Project
        .findOne(filter)
        .then(project => {

            if (!project) {
                return res.status(400).json({
                    status: false,
                    error: 'No project was found'
                })
            }

            if (project.owner.toString() !== currentUserId ) {
                return res.status(401).json({
                    status: false,
                    error: 'You can only update your project'
                })
            }

            const { 
                title,
                slug,
                caption,
                description,
                due_date,
             } = req.body;
             
             if(title) project.title = title;
             if(slug) project.slug = slug.trim().toLowerCase().replace(/\s+/g, '-');
             if(caption) project.caption = caption;
             if(description) project.description = description;
             if(due_date) project.due_date = due_date;
             
            project.save(err => {
                if (err) {
                    return res.status(500).json({
                        status: false,
                        error: 'Internal Server error',
                      
                    })
                }
        
                return res.status(200).json({
                    status: true,
                    message: 'Projected updated successfully',
                    data: project
                })
        
            });
        })
        .catch(err => {
            return res.status(500).json({
                status: false,
                error: 'Internal Server error in retrieving project',
            
            })
        })


};


/****Allow authenticated users to add Budget to project their project BUDGET */
const addBudgetByProjectId = (req, res) => {
    const errorsContainer = validationResult(req);
    if (!errorsContainer.isEmpty()) {
        return res.status(422).json({
        status: false,
        errors: errorsContainer.errors.map(err => err.msg)
        });
    }
    /*** Confirm user is authenticated */
    const currentUserId = req.authUser.id;
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            status: false,
            error: 'No id, Invalid request'
        })
    }
    let filter = {
        owner: currentUserId,
        _id: id
    }
    Project
        .findOne(filter)
        .then(project => {

            if (!project) {
                return res.status(400).json({
                    status: false,
                    error: 'No project was found'
                })
            }

            if (project.owner.toString() !== currentUserId ) {
                return res.status(401).json({
                    status: false,
                    error: 'You can only update your project'
                })
            }

            const { 
                budget
             } = req.body;

             if (!Array.isArray(budget) || budget.length < 1 ) {
                return res.status(400).json({
                    status: false,
                    error: 'Invalid data supplied'
                })
            }
             let amount = 0;
            let projectBudget = budget.map(projectItem => {
                 const { item_name, unit_cost, quantity, comment } = projectItem;
                 
                 let numericQuantity = Number.parseInt(quantity);
                 let numericUnitCost = Number.parseFloat(unit_cost);
                 let line_total = numericQuantity * numericUnitCost ;

                 amount += line_total;

                return {
                    item_name,
                    unit_cost: numericUnitCost,
                    quantity: numericQuantity,
                    line_total,
                    comment
                }
             })
             
             project.budget = projectBudget;
             project.amount = amount;
             project.approved = false;

            project.save(err => {
                if (err) {
                    return res.status(500).json({
                        status: false,
                        error: 'Internal Server error',
                      
                    })
                }
        
                return res.status(200).json({
                    status: true,
                    message: 'Project budget updated successfully',
                    data: project
                })
        
            });
        })
        .catch(err => {
            return res.status(500).json({
                status: false,
                error: 'Internal Server error in retrieving project',
            
            })
        })


};

/****Allow authenticated users to update their project BUDGET */
const updateBudgetById = (req, res) => {
    const errorsContainer = validationResult(req);
    if (!errorsContainer.isEmpty()) {
        return res.status(422).json({
        status: false,
        errors: errorsContainer.errors.map(err => err.msg)
        });
    }
    /*** Confirm user is authenticated */
    const currentUserId = req.authUser.id;
    const { projectId, budgetId } = req.params;
    if (!projectId || !budgetId) {
        return res.status(400).json({
            status: false,
            error: 'No id, Invalid request'
        })
    }
    let filter = {
        owner: currentUserId,
        _id: projectId
    }
    Project
        .findOne(filter)
        .then(project => {

            if (!project) {
                return res.status(400).json({
                    status: false,
                    error: 'No project was found'
                })
            }

            if (project.owner.toString() !== currentUserId ) {
                return res.status(401).json({
                    status: false,
                    error: 'You can only update your project'
                })
            }

            const { 
                item_name, unit_cost, quantity, comment
             } = req.body;

            //  if(item_name) project

            //  if (!Array.isArray(budget) || budget.length < 1 ) {
            //     return res.status(400).json({
            //         status: false,
            //         error: 'Invalid data supplied'
            //     })
            // }
             let amount = 0;
            let projectBudget = project.budget.map(budgetLineItem => {

                if (budgetLineItem._id.toString() === budgetId) {

                    let numericQuantity = Number.parseInt(quantity);
                    let numericUnitCost = Number.parseFloat(unit_cost);
                    let line_total = numericQuantity * numericUnitCost ;

                    budgetLineItem.item_name = item_name ? item_name : budgetLineItem.item_name;
                    budgetLineItem.unit_cost = unit_cost ? numericUnitCost : budgetLineItem.unit_cost;
                    budgetLineItem.quantity = quantity ? numericQuantity : budgetLineItem.quantity;
                    budgetLineItem.line_total = line_total ? line_total : budgetLineItem.line_total;
                    budgetLineItem.comment = comment ? comment : budgetLineItem.comment;
                    
                }
                
                amount += budgetLineItem.line_total;
                return budgetLineItem; 
             })
             
             project.budget = projectBudget;
             project.amount = amount;
             project.approved = false;

            project.save(err => {
                if (err) {
                    return res.status(500).json({
                        status: false,
                        error: 'Internal Server error',
                      
                    })
                }
        
                return res.status(200).json({
                    status: true,
                    message: 'Project budget updated successfully',
                    data: project.budget
                })
        
            });
        })
        .catch(err => {
            return res.status(500).json({
                status: false,
                error: 'Internal Server error in retrieving project',
            
            })
        })


};
/****Allow authenticated users to remove budget item from their project BUDGET */
const removeBudgetItem = (req, res) => {
   
    /*** Confirm user is authenticated */
    const currentUserId = req.authUser.id;
    const { projectId, budgetId } = req.params;
    if (!projectId || !budgetId) {
        return res.status(400).json({
            status: false,
            error: 'No id, Invalid request'
        })
    }
    let filter = {
        owner: currentUserId,
        _id: projectId
    }
    Project
        .findOne(filter)
        .then(project => {

            if (!project) {
                return res.status(400).json({
                    status: false,
                    error: 'No project was found'
                })
            }

            if (project.owner.toString() !== currentUserId ) {
                return res.status(401).json({
                    status: false,
                    error: 'You can only update your project'
                })
            }

            // const { 
            //     item_name, unit_cost, quantity, comment
            //  } = req.body;

           
            //  let amount = 0;
            let projectBudget = project.budget.filter(budgetLineItem => budgetLineItem._id.toString() !== budgetId);

            //     if (budgetLineItem._id.toString() === budgetId) {

            //         let numericQuantity = Number.parseInt(quantity);
            //         let numericUnitCost = Number.parseFloat(unit_cost);
            //         let line_total = numericQuantity * numericUnitCost ;

            //         budgetLineItem.item_name = item_name ? item_name : budgetLineItem.item_name;
            //         budgetLineItem.unit_cost = unit_cost ? numericUnitCost : budgetLineItem.unit_cost;
            //         budgetLineItem.quantity = quantity ? numericQuantity : budgetLineItem.quantity;
            //         budgetLineItem.line_total = line_total ? line_total : budgetLineItem.line_total;
            //         budgetLineItem.comment = comment ? comment : budgetLineItem.comment;
                    
            //     }
                
            //     amount += budgetLineItem.line_total;
            //     return budgetLineItem; 
            //  })
             
             project.budget = projectBudget;
            //  project.amount = amount;
             project.approved = false;
console.log(projectBudget)
            project.save(err => {
                if (err) {
                    return res.status(500).json({
                        status: false,
                        error: 'Internal Server error',
                        ert: err
                      
                    })
                }
        
                return res.status(200).json({
                    status: true,
                    message: 'Project budget updated successfully',
                    data: project.budget
                })
        
            });
        })
        .catch(err => {
            return res.status(500).json({
                status: false,
                error: 'Internal Server error in retrieving project',
            
            })
        })


};


/****Allow authenticated User to see  project */
// A use can only get his/her prokect except he is an admin and requests to view all
const getProjects = (req, res) => {
    const currentUserId = req.authUser.id;
    let filter = {
        owner: currentUserId
    };
    const { id, slug, admin } = req.query;
    if(id) filter._id = id;
    if(slug) filter.slug = slug;

    if (admin === true && req.authUser.auth.includes('admin')) filter = {};

    Project
        .find(filter)
        .then(projects => {
           
            return res.status(200).json({
                status: true,
                message: 'Requested project details',
                data: projects
            })

        }).catch(err => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    error: 'Internal Server error'
                })
            }
        })
};


/****Allow authenticated ADMIN to delete  project */
const deleteProject = (req, res) => {
    let filter = {};
    const { id } = req.query;
    if(id) filter._id = id;
    // if (!req.authUser.auth.includes('admin')) {
    //     return res.status(401).json({
    //         status: false,
    //         error: 'Only admin can delete projects'
    //     })
    // }

    Project
        .find(filter)
        .then(projects => {

            Project.deleteMany(filter, (err, prevProject) => {
                if (err) {
                    return res.status(500).json({
                        status: false,
                        error: 'Internal Server error'
                    })
                }

                return res.status(200).json({
                    status: true,
                    message: 'project deleted',
                    data: projects
                })
            })


        })
};

module.exports = {
    createProject,
    updateProjectById,
    addBudgetByProjectId,
    updateBudgetById,
    removeBudgetItem,
    getProjects,
    deleteProject,
}