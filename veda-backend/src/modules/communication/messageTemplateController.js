const MessageTemplate = require('./messageTemplateModel');
const { schoolId } = require('./communicationTenantScope');

exports.createMessageTemplate = async (req, res) => {
  try {
    const school = schoolId(req);
    const { title, message, type, category } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const template = await MessageTemplate.create({
      schoolId: school,
      title: title.trim(),
      message: message.trim(),
      type: type || 'SMS',
      category: category || 'General'
    });

    res.status(201).json({
      success: true,
      message: 'Message template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Error creating message template:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

exports.getMessageTemplates = async (req, res) => {
  try {
    const school = schoolId(req);

    const templates = await MessageTemplate.find({ schoolId: school }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching message templates:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

exports.updateMessageTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { title, message, type, category } = req.body;

    const school = schoolId(req);

    const template = await MessageTemplate.findOne({ _id: templateId, schoolId: school });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Message template not found'
      });
    }

    if (title !== undefined) template.title = title.trim();
    if (message !== undefined) template.message = message.trim();
    if (type !== undefined) template.type = type;
    if (category !== undefined) template.category = category;

    if (!template.title || !template.message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    await template.save();

    res.status(200).json({
      success: true,
      message: 'Message template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Error updating message template:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

exports.deleteMessageTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const school = schoolId(req);

    const template = await MessageTemplate.findOne({ _id: templateId, schoolId: school });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Message template not found'
      });
    }

    await MessageTemplate.findOneAndDelete({ _id: templateId, schoolId: school });

    res.status(200).json({
      success: true,
      message: 'Message template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message template:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};