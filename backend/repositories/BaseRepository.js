const IRepository = require('./IRepository');

class BaseRepository extends IRepository {
  constructor(model) {
     super();
      if (!model) {
      throw new Error('Model is required for BaseRepository');
     }
      this.model = model;
  }

    toObject(doc) {
    if (!doc) return null;
     if (doc.toObject) {
        return doc.toObject();
    }
     return doc;
    }

   async findById(id, options = {}) {
      try {
      let query = this.model.findById(id);
      
        if (options.populate) {
        if (Array.isArray(options.populate)) {
           options.populate.forEach(pop => {
              query = query.populate(pop);
          });
         } else {
            query = query.populate(options.populate);
        }
       }
      
      const doc = await query.exec();
       return this.toObject(doc);
      } catch (error) {
      throw new Error(`Error finding entity by ID: ${error.message}`);
     }
    }

   async find(criteria = {}, options = {}) {
      try {
      let query = this.model.find(criteria);

        if (options.sort) {
        query = query.sort(options.sort);
       }

      if (options.limit) {
         query = query.limit(options.limit);
        }

       if (options.skip) {
          query = query.skip(options.skip);
      }

        if (options.populate) {
        if (Array.isArray(options.populate)) {
           options.populate.forEach(pop => {
              query = query.populate(pop);
          });
         } else {
            query = query.populate(options.populate);
        }
       }

      const docs = await query.exec();
       return docs.map(doc => this.toObject(doc));
      } catch (error) {
      throw new Error(`Error finding entities: ${error.message}`);
     }
    }

   async findOne(criteria = {}, options = {}) {
      try {
      let query = this.model.findOne(criteria);
      
        if (options.populate) {
        if (Array.isArray(options.populate)) {
           options.populate.forEach(pop => {
              query = query.populate(pop);
          });
         } else {
            query = query.populate(options.populate);
        }
       }
      
      const doc = await query.exec();
       return this.toObject(doc);
      } catch (error) {
      throw new Error(`Error finding entity: ${error.message}`);
     }
    }

   async create(data) {
      try {
      const doc = new this.model(data);
       const saved = await doc.save();
        return this.toObject(saved);
    } catch (error) {
       throw new Error(`Error creating entity: ${error.message}`);
      }
  }

    async updateById(id, data) {
    try {
       const doc = await this.model.findByIdAndUpdate(
          id,
        { ...data, updatedAt: new Date() },
         { new: true, runValidators: true }
        );
      return this.toObject(doc);
     } catch (error) {
        throw new Error(`Error updating entity: ${error.message}`);
    }
   }

  async deleteById(id) {
     try {
        const result = await this.model.findByIdAndDelete(id);
      return !!result;
     } catch (error) {
        throw new Error(`Error deleting entity: ${error.message}`);
    }
   }

  async count(criteria = {}) {
     try {
        return await this.model.countDocuments(criteria);
    } catch (error) {
       throw new Error(`Error counting entities: ${error.message}`);
      }
  }
}

module.exports = BaseRepository;

