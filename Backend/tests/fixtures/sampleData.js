export const mockUser = {
  _id: '6735a4f00112233445566778',
  name: 'John Doe',
  email: 'johndoe@example.com',
  role: 'student',
  createdAt: '2026-11-14T10:00:00.000Z',
  updatedAt: '2026-11-14T10:00:00.000Z',
  matchPassword: async (pwd) => pwd === 'CorrectPassword123!',
};

export const mockDocument = {
  _id: '6735b5e00212233445566779',
  title: 'Operating Systems Notes',
  subject: 'Operating Systems',
  topic: 'Process Scheduling',
  folder: 'Lectures',
  originalFileName: 'os_lecture.pdf',
  filePath: 'uploads/test-os-lecture.pdf',
  mimeType: 'application/pdf',
  uploadedBy: '6735a4f00112233445566778',
  processingStatus: 'processed',
  createdAt: '2026-11-14T10:05:00.000Z',
  updatedAt: '2026-11-14T10:05:00.000Z',
};

export const mockChunks = [
  {
    chunkIndex: 0,
    text: 'Operating Systems manage computer hardware and software resources. The kernel is the central component.',
    charCount: 104,
  },
  {
    chunkIndex: 1,
    text: 'The kernel is the central component. CPU scheduling algorithms include FCFS and Round Robin.',
    charCount: 92,
  },
];

export const mockEmbedding = new Array(768).fill(0.1234);
