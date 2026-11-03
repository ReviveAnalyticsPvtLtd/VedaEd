const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

require('../src/modules/class/classSchema');
require('../src/modules/section/sectionSchema');
const studentController = require('../src/modules/student/studentControllers');
const parentController = require('../src/modules/parents/parentControllers');

async function testApisAndFrontendMapping() {
  await mongoose.connect(process.env.db_Connect_String);
  console.log('Connected to MongoDB');

  const schoolId = '6ae879d5f8a896ece249aca1';
  const makeReqRes = (params = {}, query = {}) => {
    let statusCode = 200;
    let responseData = null;
    const req = {
      user: { schoolId, userId: '6ae879d5f8a896ece249aca0', role: 'admin' },
      params,
      query,
    };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { responseData = data; return res; },
    };
    return { req, res, getResult: () => ({ statusCode, data: responseData }) };
  };

  // 1. Test GET /students/:id for all 4 students
  const studentIds = [
    { name: 'Aarav Sharma', id: '6ae97f9fc821f3599c440992' },
    { name: 'Ananya Sharma', id: '6ae97f9fc821f3599c44099d' },
    { name: 'Vivaan Patel', id: '6ae97fa1c821f3599c4409a8' },
    { name: 'Diya Verma', id: '6ae97fa2c821f3599c4409b3' },
  ];

  console.log('\n================ 1. GET /students/:id PROFILE API TEST ================');
  for (const item of studentIds) {
    const { req, res, getResult } = makeReqRes({ id: item.id });
    await studentController.getStudent(req, res);
    const { statusCode, data } = getResult();
    console.log(`\nStudent ${item.name} (${item.id}): Status ${statusCode}, Success: ${data?.success}`);
    const s = data?.student;
    console.log('Class:', s?.personalInfo?.class, 'Section:', s?.personalInfo?.section);
    console.log('DOB:', s?.personalInfo?.DOB, 'Gender:', s?.personalInfo?.gender, 'Blood:', s?.personalInfo?.bloodGroup);
    console.log('Mobile:', s?.personalInfo?.contactDetails?.mobileNumber, 'Email:', s?.personalInfo?.contactDetails?.email);
    console.log('ContactInfo:', s?.contactInfo);
    console.log('EmergencyContact:', s?.emergencyContact);
    console.log('EarlierAcademic:', s?.earlierAcademic);
    console.log('Parent Populated:', s?.parent ? {
      parentId: s.parent.parentId,
      name: s.parent.name,
      fatherName: s.parent.fatherName,
      motherName: s.parent.motherName,
      guardian: s.parent.guardian
    } : 'None');
  }

  // 2. Test GET /parents
  console.log('\n================ 2. GET /parents LIST API TEST ================');
  const { req: pReq, res: pRes, getResult: pResult } = makeReqRes({}, { keyword: '' });
  await parentController.getAllParents(pReq, pRes);
  const { statusCode: pStatus, data: pData } = pResult();
  console.log(`Status: ${pStatus}, Total parents returned: ${pData?.parents?.length}`);
  const targetParents = (pData?.parents || []).filter(p => p.parentId === 'PRN-2026-1193' || p.parentId === 'PRN-2026-1194');
  for (const tp of targetParents) {
    console.log(`--- Parent ${tp.name} (${tp.parentId}) ---`);
    console.log(`Email: ${tp.email}, Phone: ${tp.phone}, Role: ${tp.role}, Status: ${tp.status}`);
    console.log(`Children count: ${tp.children?.length}`);
    console.log(`Children details:`, tp.children?.map(c => c.personalInfo?.stdId || c.stdId || c));
  }

  // 3. Test GET /parents/:id (by parentId and by child stdId)
  console.log('\n================ 3. GET /parents/:id PROFILE API TEST ================');
  // Lookup by Parent ID
  {
    const { req, res, getResult } = makeReqRes({ id: 'PRN-2026-1193' });
    await parentController.getParentbyId(req, res);
    const { statusCode, data } = getResult();
    console.log(`Lookup PRN-2026-1193: Status ${statusCode}, Name: ${data?.parent?.name}`);
    console.log(`Father details:`, data?.parent?.fatherName, data?.parent?.fatherOccupation, data?.parent?.fatherPhone);
    console.log(`Mother details:`, data?.parent?.motherName, data?.parent?.motherOccupation, data?.parent?.motherPhone);
  }
  // Lookup by Child stdId (STD-2026-2531)
  {
    const { req, res, getResult } = makeReqRes({ id: 'STD-2026-2531' });
    await parentController.getParentbyId(req, res);
    const { statusCode, data } = getResult();
    console.log(`Lookup by child stdId STD-2026-2531: Status ${statusCode}, Name: ${data?.parent?.name}, ParentID: ${data?.parent?.parentId}`);
  }
  // Lookup Vivaan Patel's parent PRN-2026-1194
  {
    const { req, res, getResult } = makeReqRes({ id: 'PRN-2026-1194' });
    await parentController.getParentbyId(req, res);
    const { statusCode, data } = getResult();
    console.log(`Lookup PRN-2026-1194: Status ${statusCode}, Name: ${data?.parent?.name}`);
    console.log(`Guardian details:`, data?.parent?.guardian);
  }

  await mongoose.disconnect();
}

testApisAndFrontendMapping().catch(console.error);

