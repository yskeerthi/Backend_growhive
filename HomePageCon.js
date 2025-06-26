// routes/domains.js
const express = require('express');
const mongoose=require('mongoose');
const router = express.Router();
const User = require('../models/User'); 

const DOMAIN_IMAGES = {
    'Artificial Intelligence': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
    'Machine Learning': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop',
    'Data Science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    'Cybersecurity': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop',
    'Web Development': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=200&fit=crop',
    'Mobile Development': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
    'Blockchain': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop',
    'Game Development': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=200&fit=crop',
    'UI/UX Design': 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=200&fit=crop',
    'Cloud Computing': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop',
    'DevOps': 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=200&fit=crop',
    'Software Engineering': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop',
    'Database Management': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=200&fit=crop',
    'Network Administration': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
    'Digital Marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
    'Project Management': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop',
    'Quality Assurance': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop',
    'Data Analysis': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    'Business Intelligence': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop'
};



//Home Page Route Akka
exports.userskill = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('name skillsToLearn skillsOwned profileImageUrl');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const uniqueDomains = [...new Set(user.skillsToLearn.map(skill => skill.domain))];

        const domainsWithDetails = await Promise.all(
            uniqueDomains.map(async (domain) => {
                // Count learners in that domain excluding the current user
                const expertCount = await User.countDocuments({
                    _id: { $ne: userId },
                    'skillsOwned.domain': domain
                });

                const experts = await User.find({
                    _id: { $ne: userId },
                    'skillsOwned.domain': domain
                })
                    .select('profileImageUrl')
                    .limit(3);

                const avatars = experts
                    .filter(expert => expert.profileImageUrl)
                    .map(expert => expert.profileImageUrl);

                return {
                    id: domain.replace(/\s+/g, '-').toLowerCase(),
                    title: domain,
                    image: DOMAIN_IMAGES[domain] || 'https://via.placeholder.com/400x200',
                    learners: expertCount,
                    learnersAvatars: avatars,
                    bookmarked: false
                };
            })
        );

        res.json({
            userName: user.name,
            domains: domainsWithDetails
        });

    } catch (error) {
        console.error('Error fetching user learning domains:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


//Domain Base cheysukunne vasthadii data

exports.skillsowned = async (req, res) => {
    try {
        const { domainName } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const { userId } = req.body; // Get userId from request body
        
        console.log('Fetching experts for domain:', domainName);
        console.log('Excluding user ID:', userId);
                  
        // Build query to exclude specified user
        const query = {
            'skillsOwned.domain': domainName
        };
        
        // Add user exclusion if userId is provided
        if (userId) {
            query._id = { $ne: userId };
        }

        const experts = await User.find(query)
            .select('name email profileImageUrl bio location university skillsOwned skillsToLearn')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
                 
        const formattedExperts = experts.map(expert => {
            const domainSkills = expert.skillsOwned.filter(skill => skill.domain === domainName);
                         
            return {
                id: expert._id,
                name: expert.name,
                email: expert.email,
                profileImageUrl: expert.profileImageUrl || 'https://via.placeholder.com/100x100',
                bio: expert.bio || 'No bio available',
                location: expert.location,
                university: expert.university,
                skills: domainSkills.map(skill => ({
                    skill: skill.skill,
                    proficiency: skill.proficiency,
                    domain: skill.domain
                })),
                wantsToLearn: [...new Set(expert.skillsToLearn.map(skill => skill.domain))] || [],
            };
        });

        // Count total experts excluding specified user
        const totalExperts = await User.countDocuments(query);

        console.log(`Found ${formattedExperts.length} experts for domain: ${domainName} (excluding user: ${userId})`);

        res.json({
            experts: formattedExperts,
            totalExperts,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalExperts / limit),
            hasNextPage: page < Math.ceil(totalExperts / limit),
            domain: domainName
        });
    } catch (error) {
        console.error('Error fetching domain experts:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};





exports.all= async (req, res) => {
    try {
        const allDomains = [
            'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cybersecurity',
            'Web Development', 'Mobile Development', 'Blockchain', 'Game Development',
            'UI/UX Design', 'Cloud Computing', 'DevOps', 'Software Engineering',
            'Database Management', 'Network Administration', 'Digital Marketing',
            'Project Management', 'Quality Assurance', 'Data Analysis', 'Business Intelligence'
        ];

        const domainsWithDetails = await Promise.all(
            allDomains.map(async (domain) => {
                const expertCount = await User.countDocuments({
                    'skillsOwned.domain': domain
                });

                const experts = await User.find({ 'skillsOwned.domain': domain })
                    .select('profileImageUrl')
                    .limit(3);

                const avatars = experts
                    .filter(expert => expert.profileImageUrl)
                    .map(expert => expert.profileImageUrl);

                return {
                    id: domain.replace(/\s+/g, '-').toLowerCase(),
                    title: domain,
                    image: DOMAIN_IMAGES[domain] || 'https://via.placeholder.com/400x200',
                    learners: expertCount,
                    learnersAvatars: avatars,
                    bookmarked: false
                };
            })
        );

       
        const activeDomainsOnly = domainsWithDetails.filter(domain => domain.learners > 0);

        res.json(activeDomainsOnly);
    } catch (error) {
        console.error('Error fetching all domains:', error);
        res.status(500).json({ message: 'Server error' });
    }
};





exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Group skillsOwned into domain-wise structure
    const domainMap = {};
    user.skillsOwned.forEach((item) => {
      if (!domainMap[item.domain]) {
        domainMap[item.domain] = [];
      }
      domainMap[item.domain].push({
        skill: item.skill,
        level: item.proficiency,
      });
    });

    const domainsFormatted = Object.keys(domainMap).map((domain) => ({
      name: domain,
      subskills: domainMap[domain],
    }));

    // Format skillsToLearn
    const skillsToLearnMap = {};
    user.skillsToLearn.forEach((item) => {
      if (!skillsToLearnMap[item.domain]) {
        skillsToLearnMap[item.domain] = [];
      }
      skillsToLearnMap[item.domain].push(item.skill);
    });

    const wantsToLearn = Object.keys(skillsToLearnMap).map((domain) => ({
      domain,
      skills: skillsToLearnMap[domain],
    }));

    const profileData = {
      id: user._id,
      name: user.name,
      fullName: user.name,
      username: user.email.split("@")[0],
      connections: 100, // mock data or fetch from actual logic
      university: user.university,
      branch: user.education,
      location: user.location,
      image: user.profileImageUrl,
      rating: user.rating,
      domains: domainsFormatted,
      wantsToLearn: wantsToLearn,
    };

    return res.status(200).json({ success: true, data: profileData });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

