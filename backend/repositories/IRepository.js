class IRepository {
   async findById(id) {
      throw new Error('findById method must be implemented');
  }

    async find(criteria = {}, options = {}) {
    throw new Error('find method must be implemented');
   }

  async findOne(criteria = {}) {
     throw new Error('findOne method must be implemented');
    }

   async create(data) {
      throw new Error('create method must be implemented');
  }

    async updateById(id, data) {
    throw new Error('updateById method must be implemented');
   }

  async deleteById(id) {
     throw new Error('deleteById method must be implemented');
    }

   async count(criteria = {}) {
      throw new Error('count method must be implemented');
  }
}

module.exports = IRepository;

