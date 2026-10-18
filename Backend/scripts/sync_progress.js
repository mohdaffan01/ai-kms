import mongoose from 'mongoose';
import Progress from '../src/models/progress.model.js';
import Document from '../src/models/document.model.js';
import { extractTopicsFromDocument } from '../src/services/topicExtractor.service.js';
import { DEFAULT_CS_SUBJECTS } from '../src/controllers/progress.controller.js';

async function syncAllUsers() {
  await mongoose.connect('mongodb://127.0.0.1:27017/aikms');
  console.log('Connected to MongoDB');

  const allProgress = await Progress.find({});
  console.log(`Found ${allProgress.length} progress records.`);

  for (const prog of allProgress) {
    const userId = prog.userId;
    const userDocs = await Document.find({ uploadedBy: userId });
    console.log(`User ${userId} has ${userDocs.length} uploaded docs.`);

    // Gather unique subject names from user documents
    const docSubjects = [...new Set(userDocs.map((d) => (d.subject || '').trim()).filter(Boolean))];
    const cleanSubjects = docSubjects.map((name, idx) => ({
      id: `sub-sync-${idx + 1}`,
      name,
      code: '',
      description: `Subject from uploaded study materials`,
      category: 'Coursework',
      icon: 'BookOpen',
      color: '#10a37f',
      topics: [],
    }));

    // For each subject, extract hierarchical topics from matching user docs
    for (const subj of cleanSubjects) {
      const matchingDocs = userDocs.filter(
        (d) => d.subject && d.subject.trim().toLowerCase() === subj.name.trim().toLowerCase()
      );

      if (matchingDocs.length > 0) {
        console.log(`Extracting hierarchical topics for ${subj.name} from ${matchingDocs.length} docs...`);
        const finalTopics = [];
        const seenParentNames = new Set();

        for (const doc of matchingDocs) {
          const chapters = await extractTopicsFromDocument(doc);
          chapters.forEach((chap, pIdx) => {
            const lower = chap.name.trim().toLowerCase();
            if (!seenParentNames.has(lower)) {
              seenParentNames.add(lower);
              const subtopics = (chap.subtopics || []).map((subName, sIdx) => ({
                id: `subtop-${subj.id}-${finalTopics.length + 1}-${sIdx + 1}`,
                name: subName.trim(),
                completed: false,
                completedAt: null,
              }));

              finalTopics.push({
                id: `top-${subj.id}-${finalTopics.length + 1}`,
                name: chap.name.trim(),
                completed: false,
                completedAt: null,
                isExtracted: true,
                subtopics,
              });
            }
          });
        }
        subj.topics = finalTopics;
        console.log(`Extracted ${finalTopics.length} Parent chapters for ${subj.name}.`);
      } else {
        subj.topics = [];
      }
    }

    prog.subjects = cleanSubjects;
    await prog.save();
    console.log(`Successfully updated progress for user ${userId}.`);
  }

  process.exit(0);
}

syncAllUsers().catch(console.error);
