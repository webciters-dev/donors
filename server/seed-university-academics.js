// server/seed-university-academics.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enhanced Pakistani Universities Academic Data
const pakistaniUniversitiesData = {
  'Lahore University of Management Sciences (LUMS)': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Computer Science": [
          "Computer Science",
          "Computer Engineering", 
          "Data Science",
          "Artificial Intelligence"
        ],
        "Business": [
          "Business Administration",
          "Economics",
          "Accounting & Finance",
          "Marketing",
          "Supply Chain Management"
        ],
        "Engineering": [
          "Electrical Engineering",
          "Chemical Engineering",
          "Mechanical Engineering"
        ],
        "Social Sciences": [
          "Political Science",
          "Psychology",
          "Sociology",
          "Anthropology"
        ],
        "Liberal Arts": [
          "English Literature",
          "Philosophy",
          "History"
        ]
      },
      "Master's": {
        "Computer Science": [
          "Computer Science",
          "Data Science",
          "Machine Learning",
          "Cybersecurity"
        ],
        "Business": [
          "MBA",
          "Executive MBA",
          "Master in Finance",
          "Master in Marketing"
        ],
        "Engineering": [
          "Electrical Engineering",
          "Chemical Engineering"
        ]
      },
      "Doctoral": {
        "Computer Science": [
          "Computer Science",
          "Data Science"
        ],
        "Business": [
          "Business Administration",
          "Economics"
        ]
      }
    }
  },

  'National University of Sciences and Technology (NUST)': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Engineering": [
          "Computer Engineering",
          "Software Engineering",
          "Electrical Engineering",
          "Mechanical Engineering",
          "Civil Engineering",
          "Aerospace Engineering",
          "Chemical Engineering",
          "Materials Engineering",
          "Industrial Engineering",
          "Environmental Engineering"
        ],
        "Computer Science": [
          "Computer Science",
          "Information Technology",
          "Cybersecurity",
          "Artificial Intelligence"
        ],
        "Sciences": [
          "Mathematics",
          "Physics",
          "Chemistry",
          "Biology"
        ],
        "Business": [
          "Business Administration",
          "Management Sciences"
        ],
        "Architecture": [
          "Architecture",
          "Urban Planning"
        ]
      },
      "Master's": {
        "Engineering": [
          "Computer Engineering",
          "Software Engineering", 
          "Electrical Engineering",
          "Mechanical Engineering",
          "Civil Engineering",
          "Aerospace Engineering"
        ],
        "Computer Science": [
          "Computer Science",
          "Information Security",
          "Data Science"
        ],
        "Business": [
          "MBA",
          "Project Management"
        ]
      },
      "Doctoral": {
        "Engineering": [
          "Computer Engineering",
          "Electrical Engineering",
          "Mechanical Engineering"
        ],
        "Computer Science": [
          "Computer Science"
        ]
      }
    }
  },

  'Institute of Business Administration (IBA) Karachi': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Business": [
          "Business Administration",
          "Accounting & Finance",
          "Marketing",
          "Human Resource Management",
          "International Business",
          "Economics",
          "Entrepreneurship"
        ],
        "Computer Science": [
          "Computer Science",
          "Information Technology"
        ],
        "Social Sciences": [
          "Psychology",
          "Social Sciences"
        ]
      },
      "Master's": {
        "Business": [
          "MBA",
          "Executive MBA",
          "Master in Finance",
          "Master in Economics",
          "Master in Human Resource Management"
        ],
        "Computer Science": [
          "Computer Science",
          "Information Technology"
        ]
      },
      "Doctoral": {
        "Business": [
          "Business Administration",
          "Economics"
        ]
      }
    }
  },

  'University of the Punjab': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Computer Science": [
          "Computer Science",
          "Software Engineering",
          "Information Technology",
          "Artificial Intelligence"
        ],
        "Engineering": [
          "Computer Engineering",
          "Electrical Engineering",
          "Mechanical Engineering",
          "Civil Engineering",
          "Chemical Engineering"
        ],
        "Business": [
          "Business Administration",
          "Commerce",
          "Economics",
          "Banking & Finance"
        ],
        "Medicine": [
          "Medicine (MBBS)",
          "Dentistry (BDS)",
          "Pharmacy (Pharm-D)",
          "Physiotherapy"
        ],
        "Liberal Arts": [
          "English Literature",
          "Urdu Literature",
          "History",
          "Political Science",
          "Philosophy",
          "Islamic Studies"
        ],
        "Sciences": [
          "Physics",
          "Chemistry", 
          "Mathematics",
          "Biology",
          "Statistics"
        ]
      },
      "Master's": {
        "Computer Science": [
          "Computer Science",
          "Software Engineering",
          "Information Technology"
        ],
        "Engineering": [
          "Computer Engineering",
          "Electrical Engineering",
          "Mechanical Engineering"
        ],
        "Business": [
          "MBA",
          "Commerce",
          "Economics"
        ],
        "Liberal Arts": [
          "English Literature",
          "History",
          "Political Science"
        ]
      },
      "Doctoral": {
        "Computer Science": [
          "Computer Science"
        ],
        "Engineering": [
          "Electrical Engineering"
        ],
        "Business": [
          "Economics"
        ]
      }
    }
  },

  'University of Karachi': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Computer Science": [
          "Computer Science",
          "Software Engineering"
        ],
        "Business": [
          "Business Administration",
          "Commerce",
          "Economics"
        ],
        "Liberal Arts": [
          "English Literature",
          "Urdu Literature", 
          "Sociology",
          "Psychology",
          "Mass Communication",
          "International Relations"
        ],
        "Sciences": [
          "Mathematics",
          "Physics",
          "Chemistry",
          "Statistics",
          "Geography"
        ],
        "Law": [
          "Law (LLB)"
        ]
      },
      "Master's": {
        "Computer Science": [
          "Computer Science"
        ],
        "Business": [
          "MBA",
          "Economics"
        ],
        "Liberal Arts": [
          "English Literature",
          "Mass Communication",
          "International Relations"
        ]
      }
    }
  },

  'FAST National University': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Computer Science": [
          "Computer Science",
          "Software Engineering",
          "Computer Engineering",
          "Artificial Intelligence"
        ],
        "Engineering": [
          "Electrical Engineering",
          "Computer Engineering"
        ],
        "Business": [
          "Business Administration"
        ]
      },
      "Master's": {
        "Computer Science": [
          "Computer Science",
          "Software Engineering",
          "Data Science"
        ],
        "Business": [
          "MBA"
        ]
      },
      "Doctoral": {
        "Computer Science": [
          "Computer Science"
        ]
      }
    }
  },

  'COMSATS University': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Computer Science": [
          "Computer Science",
          "Software Engineering",
          "Information Technology",
          "Bioinformatics"
        ],
        "Engineering": [
          "Electrical Engineering",
          "Mechanical Engineering",
          "Civil Engineering",
          "Chemical Engineering"
        ],
        "Business": [
          "Business Administration",
          "Economics"
        ],
        "Sciences": [
          "Mathematics",
          "Physics",
          "Chemistry",
          "Statistics"
        ]
      },
      "Master's": {
        "Computer Science": [
          "Computer Science",
          "Software Engineering",
          "Information Technology"
        ],
        "Engineering": [
          "Electrical Engineering",
          "Mechanical Engineering"
        ],
        "Business": [
          "MBA"
        ]
      }
    }
  },

  'Quaid-i-Azam University': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Sciences": [
          "Physics",
          "Chemistry",
          "Mathematics",
          "Biology",
          "Environmental Sciences"
        ],
        "Liberal Arts": [
          "International Relations",
          "Political Science",
          "Economics",
          "Psychology"
        ],
        "Computer Science": [
          "Computer Science"
        ]
      },
      "Master's": {
        "Sciences": [
          "Physics",
          "Chemistry",
          "Mathematics",
          "Biology"
        ],
        "Liberal Arts": [
          "International Relations",
          "Economics"
        ]
      },
      "Doctoral": {
        "Sciences": [
          "Physics",
          "Chemistry",
          "Mathematics"
        ]
      }
    }
  },

  'University of Engineering and Technology (UET) Lahore': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Engineering": [
          "Civil Engineering",
          "Mechanical Engineering",
          "Electrical Engineering",
          "Chemical Engineering",
          "Computer Engineering",
          "Metallurgical Engineering",
          "Mining Engineering",
          "Petroleum Engineering",
          "Industrial Engineering"
        ],
        "Architecture": [
          "Architecture",
          "City & Regional Planning"
        ]
      },
      "Master's": {
        "Engineering": [
          "Civil Engineering",
          "Mechanical Engineering", 
          "Electrical Engineering",
          "Chemical Engineering"
        ],
        "Architecture": [
          "Architecture"
        ]
      },
      "Doctoral": {
        "Engineering": [
          "Civil Engineering",
          "Mechanical Engineering",
          "Electrical Engineering"
        ]
      }
    }
  },

  'Ghulam Ishaq Khan Institute (GIKI)': {
    country: 'Pakistan',
    academics: {
      "Bachelor's": {
        "Engineering": [
          "Computer Systems Engineering",
          "Electrical Engineering",
          "Mechanical Engineering",
          "Chemical Engineering",
          "Materials Engineering"
        ],
        "Computer Science": [
          "Computer Science",
          "Software Engineering"
        ]
      },
      "Master's": {
        "Engineering": [
          "Computer Systems Engineering",
          "Electrical Engineering",
          "Mechanical Engineering"
        ],
        "Computer Science": [
          "Computer Science"
        ]
      }
    }
  }
};

// Keep existing international universities data for reference
const internationalUniversitiesData = {
  'Harvard University': {
    country: 'USA',
    academics: {
      "Bachelor's": {
        "Computer Science": [
          "Computer Science",
          "Applied Mathematics with Computer Science"
        ],
        "Engineering": [
          "Biomedical Engineering",
          "Electrical Engineering",
          "Environmental Engineering"
        ],
        "Business": [
          "Economics",
          "Applied Mathematics"
        ],
        "Liberal Arts": [
          "English",
          "History",
          "Philosophy",
          "Psychology"
        ],
        "Sciences": [
          "Biology",
          "Chemistry",
          "Physics",
          "Mathematics"
        ]
      },
      "Master's": {
        "Computer Science": [
          "Computer Science",
          "Data Science"
        ],
        "Engineering": [
          "Biomedical Engineering",
          "Environmental Engineering"
        ],
        "Business": [
          "MBA"
        ]
      },
      "Doctoral": {
        "Computer Science": [
          "Computer Science"
        ],
        "Engineering": [
          "Biomedical Engineering"
        ],
        "Sciences": [
          "Biology",
          "Chemistry",
          "Physics"
        ]
      }
    }
  },

  'University of Oxford': {
    country: 'UK',
    academics: {
      "Bachelor's": {
        "Computer Science": [
          "Computer Science",
          "Computer Science and Philosophy"
        ],
        "Engineering": [
          "Engineering Science"
        ],
        "Liberal Arts": [
          "English Language and Literature",
          "History",
          "Philosophy, Politics and Economics"
        ],
        "Sciences": [
          "Physics",
          "Mathematics",
          "Chemistry",
          "Biology"
        ]
      },
      "Master's": {
        "Computer Science": [
          "Computer Science",
          "Machine Learning"
        ],
        "Engineering": [
          "Engineering Science"
        ]
      },
      "Doctoral": {
        "Computer Science": [
          "Computer Science"
        ],
        "Engineering": [
          "Engineering Science"
        ]
      }
    }
  }
};

// Combine all academic data
const allAcademicData = {
  ...pakistaniUniversitiesData,
  ...internationalUniversitiesData
};

async function seedUniversityAcademics() {
  console.log(' Starting enhanced university academics seeding...');
  console.log(' Focus: Pakistani Universities with comprehensive academic programs');

  let totalUniversities = 0;
  let totalDegrees = 0;
  let totalFields = 0; 
  let totalPrograms = 0;

  for (const [universityName, data] of Object.entries(allAcademicData)) {
    try {
      console.log(`\n️  Processing ${universityName}...`);

      // Find the university
      const university = await prisma.university.findUnique({
        where: {
          name_country: {
            name: universityName,
            country: data.country
          }
        }
      });

      if (!university) {
        console.log(`️  University "${universityName}" not found in database.`);
        console.log(`   Make sure to run the university seeding script first.`);
        continue;
      }

      console.log(`    Found university in database (ID: ${university.id})`);
      totalUniversities++;

      // Process each degree level
      for (const [degreeLevel, fields] of Object.entries(data.academics)) {
        console.log(`      Processing degree level: ${degreeLevel}`);

        // Create or get degree level
        let degreeLevelRecord;
        try {
          degreeLevelRecord = await prisma.universityDegreeLevel.create({
            data: {
              universityId: university.id,
              degreeLevel
            }
          });
          console.log(`        Created degree level: ${degreeLevel}`);
          totalDegrees++;
        } catch (error) {
          if (error.code === 'P2002') {
            // Already exists, get it
            degreeLevelRecord = await prisma.universityDegreeLevel.findUnique({
              where: {
                universityId_degreeLevel: {
                  universityId: university.id,
                  degreeLevel
                }
              }
            });
            console.log(`       ️  Degree level already exists: ${degreeLevel}`);
          } else {
            throw error;
          }
        }

        // Process each field
        for (const [fieldName, programs] of Object.entries(fields)) {
          console.log(`        Processing field: ${fieldName} (${programs.length} programs)`);

          // Create or get field
          let fieldRecord;
          try {
            fieldRecord = await prisma.universityField.create({
              data: {
                universityId: university.id,
                universityDegreeLevelId: degreeLevelRecord.id,
                degreeLevel,
                fieldName
              }
            });
            console.log(`          Created field: ${fieldName}`);
            totalFields++;
          } catch (error) {
            if (error.code === 'P2002') {
              // Already exists, get it
              fieldRecord = await prisma.universityField.findUnique({
                where: {
                  universityId_degreeLevel_fieldName: {
                    universityId: university.id,
                    degreeLevel,
                    fieldName
                  }
                }
              });
              console.log(`         ️  Field already exists: ${fieldName}`);
            } else {
              throw error;
            }
          }

          // Process each program
          for (const programName of programs) {
            try {
              await prisma.universityProgram.create({
                data: {
                  universityId: university.id,
                  universityDegreeLevelId: degreeLevelRecord.id,
                  universityFieldId: fieldRecord.id,
                  degreeLevel,
                  fieldName,
                  programName
                }
              });
              console.log(`            Created program: ${programName}`);
              totalPrograms++;
            } catch (error) {
              if (error.code === 'P2002') {
                console.log(`           ️  Program already exists: ${programName}`);
              } else {
                throw error;
              }
            }
          }
        }
      }

      console.log(`    Completed ${universityName}`);

    } catch (error) {
      console.error(`    Error processing ${universityName}:`, error);
    }
  }

  console.log('\n Enhanced university academics seeding completed!');
  console.log('\n Summary:');
  console.log(`    Universities processed: ${totalUniversities}`);
  console.log(`    Degree levels created: ${totalDegrees}`);
  console.log(`    Fields created: ${totalFields}`);
  console.log(`    Programs created: ${totalPrograms}`);
  
  // Show database statistics
  const stats = await prisma.university.count();
  const degreeStats = await prisma.universityDegreeLevel.count();
  const fieldStats = await prisma.universityField.count();
  const programStats = await prisma.universityProgram.count();
  
  console.log('\n Current Database Totals:');
  console.log(`   ️  Total Universities: ${stats}`);
  console.log(`    Total Degree Levels: ${degreeStats}`);
  console.log(`    Total Fields: ${fieldStats}`);
  console.log(`    Total Programs: ${programStats}`);
  
  // Pakistani universities specific stats
  const pakistaniUniCount = Object.keys(pakistaniUniversitiesData).length;
  console.log('\n Pakistani Universities Enhanced:');
  console.log(`    ${pakistaniUniCount} Pakistani universities now have comprehensive academic data`);
  console.log(`    These universities are now ready for testing with rich program options`);
}

async function main() {
  try {
    await seedUniversityAcademics();
  } catch (error) {
    console.error(' Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();