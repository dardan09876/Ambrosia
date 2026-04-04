// js/systems/questGeneratorSystem.js
// Generates guild-specific quests tailored to player's guild, class, and skills

const QuestGeneratorSystem = {
    // Get dominant skills (top N by value)
    getDominantSkills(skills, count = 2) {
        return Object.entries(skills)
            .filter(([skill]) => ['melee', 'ranged', 'magic', 'restoration', 'defense', 'stealth'].includes(skill))
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([skillName]) => skillName);
    },

    // Build player profile for scoring
    buildPlayerProfile(player) {
        return {
            guild: player.guild,
            talent: player.talent,
            skills: player.skills,
            dominantSkills: this.getDominantSkills(player.skills),
            level: player.level,
            corruption: player.corruption || 0,
            location: player.location || 'unknown',
        };
    },

    // Score a quest template based on player profile
    scoreQuestTemplate(template, profile) {
        let score = 0;

        // Guild match (biggest factor)
        if (template.guild === profile.guild) score += 100;

        // Class weighting based on talent
        if (template.classWeight && profile.talent) {
            const classWeight = template.classWeight[profile.talent] || 0;
            score += classWeight;
        }

        // Skill preferences
        if (template.preferredSkills) {
            for (const skill of template.preferredSkills) {
                const skillValue = profile.skills[skill] || 0;
                score += Math.floor(skillValue * 0.3); // Scale by skill level
                if (profile.dominantSkills.includes(skill)) {
                    score += 25; // Bonus for being a dominant skill
                }
            }
        }

        // Level range check
        if (template.minLevel && profile.level < template.minLevel) score *= 0.5;
        if (template.maxLevel && profile.level > template.maxLevel) score *= 0.5;

        return Math.max(0, score);
    },

    // Get the primary skill to use for difficulty
    getPrimarySkill(template, playerProfile) {
        if (!template.preferredSkills || template.preferredSkills.length === 0) {
            return 'melee'; // fallback
        }
        return template.preferredSkills[0];
    },

    // Get the secondary skill (if applicable)
    getSecondarySkill(template) {
        if (!template.preferredSkills || template.preferredSkills.length < 2) {
            return null;
        }
        return template.preferredSkills[1];
    },

    // Calculate difficulty for a skill check
    calculateDifficulty(skillValue, baseMultiplier = 1.0) {
        return Math.floor(skillValue * baseMultiplier);
    },

    // Generate quests for the guild
    generateGuildQuests(count = 3) {
        const player = PlayerSystem.current;
        if (!player || !player.guild) return [];

        const profile = this.buildPlayerProfile(player);
        const templates = typeof getGuildQuestTemplates !== 'undefined'
            ? getGuildQuestTemplates(player.guild)
            : [];

        // Score all templates
        const scoredTemplates = templates
            .map(template => ({
                template,
                score: this.scoreQuestTemplate(template, profile),
            }))
            .filter(entry => entry.score > 0)
            .sort((a, b) => b.score - a.score);

        // Generate quests from top-scoring templates
        return scoredTemplates.slice(0, count).map(({ template }) => {
            const primarySkill = this.getPrimarySkill(template, profile);
            const secondarySkill = this.getSecondarySkill(template);
            const primaryValue = profile.skills[primarySkill] || 1;
            const secondaryValue = secondarySkill ? profile.skills[secondarySkill] || 1 : 0;

            // Calculate difficulty based on template difficulty and player skill
            const difficultyMultiplier = template.difficultyBase || 1.0;
            const primaryDifficulty = this.calculateDifficulty(primaryValue, difficultyMultiplier);
            const secondaryDifficulty = secondaryValue ? this.calculateDifficulty(secondaryValue, difficultyMultiplier * 0.65) : null;

            // Pick a random location variant
            const location = template.locationVariants
                ? template.locationVariants[Math.floor(Math.random() * template.locationVariants.length)]
                : 'unknown location';

            // Calculate rewards
            const baseGold = Math.max(10, Math.floor(primaryValue * 0.4));
            const chestTier = primaryValue >= 150 ? 3 : primaryValue >= 75 ? 2 : 1;

            return {
                id: `${template.id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                templateId: template.id,
                guild: player.guild,
                name: template.name,
                description: template.description,
                category: template.category,
                location,
                primarySkill,
                secondarySkill,
                checks: [
                    {
                        skill: primarySkill,
                        required: primaryDifficulty,
                    },
                    ...(secondaryDifficulty ? [{
                        skill: secondarySkill,
                        required: secondaryDifficulty,
                    }] : []),
                ],
                goldReward: { min: baseGold, max: Math.floor(baseGold * 1.5) },
                chestReward: { tier: chestTier, count: 1 },
                guildReputation: 10, // Base reputation reward
            };
        });
    },

    // Generate a single quest
    generateSingleQuest(templateId) {
        const player = PlayerSystem.current;
        if (!player || !player.guild) return null;

        const template = typeof GUILD_QUEST_TEMPLATES !== 'undefined'
            ? GUILD_QUEST_TEMPLATES.find(t => t.id === templateId && t.guild === player.guild)
            : null;

        if (!template) return null;

        const profile = this.buildPlayerProfile(player);
        const primarySkill = this.getPrimarySkill(template, profile);
        const secondarySkill = this.getSecondarySkill(template);
        const primaryValue = profile.skills[primarySkill] || 1;

        const difficultyMultiplier = template.difficultyBase || 1.0;
        const primaryDifficulty = this.calculateDifficulty(primaryValue, difficultyMultiplier);
        const secondaryValue = secondarySkill ? profile.skills[secondarySkill] || 1 : 0;
        const secondaryDifficulty = secondaryValue ? this.calculateDifficulty(secondaryValue, difficultyMultiplier * 0.65) : null;

        const location = template.locationVariants
            ? template.locationVariants[Math.floor(Math.random() * template.locationVariants.length)]
            : 'unknown location';

        const baseGold = Math.max(10, Math.floor(primaryValue * 0.4));
        const chestTier = primaryValue >= 150 ? 3 : primaryValue >= 75 ? 2 : 1;

        return {
            id: `${template.id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            templateId: template.id,
            guild: player.guild,
            name: template.name,
            description: template.description,
            category: template.category,
            location,
            primarySkill,
            secondarySkill,
            checks: [
                {
                    skill: primarySkill,
                    required: primaryDifficulty,
                },
                ...(secondaryDifficulty ? [{
                    skill: secondarySkill,
                    required: secondaryDifficulty,
                }] : []),
            ],
            goldReward: { min: baseGold, max: Math.floor(baseGold * 1.5) },
            chestReward: { tier: chestTier, count: 1 },
            guildReputation: 10,
        };
    },
};
