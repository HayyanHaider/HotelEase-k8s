class BaseController {
   ok(res, data) {
      return res.json({ success: true, ...data });
  }

    created(res, data) {
    return res.status(201).json({ success: true, ...data });
   }

  fail(res, status, message) {
     return res.status(status).json({ success: false, message });
    }
}

module.exports = BaseController;
