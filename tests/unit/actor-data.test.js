/**
 * @fileoverview Unit Tests for AvantActorData
 * @version 2.0.0
 * @author Avant Development Team  
 * @description Comprehensive tests for actor data model functionality
 */

import { AvantActorData } from '../../scripts/data/actor-data.js';

describe('AvantActorData', () => {
  describe('Static Methods', () => {
    describe('getSkillAbilities', () => {
      test('should return complete skill-to-ability mapping', () => {
        const skillAbilities = AvantActorData.getSkillAbilities();
        
        expect(skillAbilities)
          .toBeObject()
          .toContainAllKeys([
            'debate', 'discern', 'endure', 'finesse', 'force',
            'command', 'charm', 'hide', 'inspect', 'intuit', 'recall', 'surge'
          ]);
      });

      test('should map skills to correct abilities', () => {
        const skillAbilities = AvantActorData.getSkillAbilities();
        
        // Might-based skills
        expect(skillAbilities.force).toBe('might');
        expect(skillAbilities.command).toBe('might');
        expect(skillAbilities.surge).toBe('might');
        
        // Grace-based skills  
        expect(skillAbilities.finesse).toBe('grace');
        expect(skillAbilities.hide).toBe('grace');
        expect(skillAbilities.charm).toBe('grace');
        
        // Intellect-based skills
        expect(skillAbilities.debate).toBe('intellect');
        expect(skillAbilities.inspect).toBe('intellect');
        expect(skillAbilities.recall).toBe('intellect');
        
        // Focus-based skills
        expect(skillAbilities.discern).toBe('focus');
        expect(skillAbilities.endure).toBe('focus');
        expect(skillAbilities.intuit).toBe('focus');
      });

      test('should return consistent mapping on multiple calls', () => {
        const mapping1 = AvantActorData.getSkillAbilities();
        const mapping2 = AvantActorData.getSkillAbilities();
        
        expect(mapping1).toEqual(mapping2);
      });

      test('should contain exactly 12 skill mappings', () => {
        const skillAbilities = AvantActorData.getSkillAbilities();
        
        expect(Object.keys(skillAbilities)).toHaveLength(12);
      });
    });

    describe('getSkillAbility', () => {
      test('should return correct ability for valid skill names', () => {
        expect(AvantActorData.getSkillAbility('force')).toBe('might');
        expect(AvantActorData.getSkillAbility('finesse')).toBe('grace');
        expect(AvantActorData.getSkillAbility('recall')).toBe('intellect');
        expect(AvantActorData.getSkillAbility('discern')).toBe('focus');
      });

      test('should return null for invalid skill names', () => {
        expect(AvantActorData.getSkillAbility('invalidSkill')).toBeNull();
        expect(AvantActorData.getSkillAbility('nonexistent')).toBeNull();
        expect(AvantActorData.getSkillAbility('')).toBeNull();
      });

      test('should handle case sensitivity correctly', () => {
        expect(AvantActorData.getSkillAbility('Force')).toBeNull();
        expect(AvantActorData.getSkillAbility('FORCE')).toBeNull();
        expect(AvantActorData.getSkillAbility('force')).toBe('might');
      });

      test('should handle null and undefined inputs', () => {
        expect(AvantActorData.getSkillAbility(null)).toBeNull();
        expect(AvantActorData.getSkillAbility(undefined)).toBeNull();
      });

      test('should work with all defined skills', () => {
        const skillAbilities = AvantActorData.getSkillAbilities();
        
        for (const [skill, expectedAbility] of Object.entries(skillAbilities)) {
          expect(AvantActorData.getSkillAbility(skill))
            .toBe(expectedAbility);
        }
      });
    });

    describe('getAbilitySkills', () => {
      test('should return correct skills for might ability', () => {
        const mightSkills = AvantActorData.getAbilitySkills('might');
        
        expect(mightSkills)
          .toBeArray()
          .toIncludeAllMembers(['command', 'force', 'surge'])
          .toHaveLength(3);
      });

      test('should return correct skills for grace ability', () => {
        const graceSkills = AvantActorData.getAbilitySkills('grace');
        
        expect(graceSkills)
          .toBeArray()
          .toIncludeAllMembers(['charm', 'finesse', 'hide'])
          .toHaveLength(3);
      });

      test('should return correct skills for intellect ability', () => {
        const intellectSkills = AvantActorData.getAbilitySkills('intellect');
        
        expect(intellectSkills)
          .toBeArray()
          .toIncludeAllMembers(['debate', 'inspect', 'recall'])
          .toHaveLength(3);
      });

      test('should return correct skills for focus ability', () => {
        const focusSkills = AvantActorData.getAbilitySkills('focus');
        
        expect(focusSkills)
          .toBeArray()
          .toIncludeAllMembers(['discern', 'endure', 'intuit'])
          .toHaveLength(3);
      });

      test('should return empty array for invalid ability names', () => {
        expect(AvantActorData.getAbilitySkills('invalid'))
          .toBeArray()
          .toBeEmpty();
        
        expect(AvantActorData.getAbilitySkills('nonexistent'))
          .toBeArray()
          .toBeEmpty();
        
        expect(AvantActorData.getAbilitySkills(''))
          .toBeArray()
          .toBeEmpty();
      });

      test('should return sorted skill arrays', () => {
        const mightSkills = AvantActorData.getAbilitySkills('might');
        const sortedMightSkills = [...mightSkills].sort();
        
        expect(mightSkills).toEqual(sortedMightSkills);
        
        const intellectSkills = AvantActorData.getAbilitySkills('intellect');
        const sortedIntellectSkills = [...intellectSkills].sort();
        
        expect(intellectSkills).toEqual(sortedIntellectSkills);
      });

      test('should handle case sensitivity correctly', () => {
        expect(AvantActorData.getAbilitySkills('Might')).toBeEmpty();
        expect(AvantActorData.getAbilitySkills('MIGHT')).toBeEmpty();
        expect(AvantActorData.getAbilitySkills('might')).not.toBeEmpty();
      });

      test('should handle null and undefined inputs', () => {
        expect(AvantActorData.getAbilitySkills(null)).toBeEmpty();
        expect(AvantActorData.getAbilitySkills(undefined)).toBeEmpty();
      });

      test('should ensure all skills are accounted for', () => {
        const allAbilities = ['might', 'grace', 'intellect', 'focus'];
        const allSkillsFromAbilities = [];
        
        allAbilities.forEach(ability => {
          const skills = AvantActorData.getAbilitySkills(ability);
          allSkillsFromAbilities.push(...skills);
        });
        
        const allSkillsFromMapping = Object.keys(AvantActorData.getSkillAbilities());
        
        expect(allSkillsFromAbilities.sort()).toEqual(allSkillsFromMapping.sort());
      });
    });

    describe('defineSchema', () => {
      test('should return a valid schema object', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema)
          .toBeObject()
          .not.toBeEmpty();
      });

      test('should include basic character information fields', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema).toContainKeys([
          'level', 'tier', 'effort', 'ancestry', 'lineage', 
          'culture', 'vocation', 'background', 'languages'
        ]);
      });

      test('should include abilities structure', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema)
          .toContainKey('abilities');
        
        expect(schema.abilities.fields).toContainKeys([
          'might', 'grace', 'intellect', 'focus'
        ]);
      });

      test('should include skills structure', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema)
          .toContainKey('skills');
        
        const skillAbilities = AvantActorData.getSkillAbilities();
        const expectedSkills = Object.keys(skillAbilities);
        
        expect(schema.skills.fields).toContainKeys(expectedSkills);
      });

      test('should include health and resource fields', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema).toContainKeys([
          'health', 'powerPoints', 'expertisePoints', 'fortunePoints', 'experience'
        ]);
      });

      test('should include combat and defense fields', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema).toContainKeys(['defense', 'defenseThreshold']);
        
        expect(schema.defense.fields).toContainKeys([
          'might', 'grace', 'intellect', 'focus'
        ]);
      });

      test('should include physical and currency fields', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema).toContainKeys(['physical', 'currency']);
        
        expect(schema.currency.fields).toContainKeys(['gold', 'silver', 'copper']);
      });

      test('should include biography and notes fields', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema).toContainKeys(['biography', 'notes']);
      });

      test('should be consistent across multiple calls', () => {
        const schema1 = AvantActorData.defineSchema();
        const schema2 = AvantActorData.defineSchema();
        
        // Compare keys since the objects contain Foundry field instances
        expect(Object.keys(schema1).sort()).toEqual(Object.keys(schema2).sort());
      });
    });
  });

  describe('Data Validation and Structure', () => {
    test('should validate skill-ability relationships are bidirectional', () => {
      const skillAbilities = AvantActorData.getSkillAbilities();
      
      for (const [skill, ability] of Object.entries(skillAbilities)) {
        const abilitySkills = AvantActorData.getAbilitySkills(ability);
        
        expect(abilitySkills)
          .toContain(skill);
      }
    });

    test('should ensure no duplicate skills across abilities', () => {
      const allAbilities = ['might', 'grace', 'intellect', 'focus'];
      const allSkills = new Set();
      
      allAbilities.forEach(ability => {
        const skills = AvantActorData.getAbilitySkills(ability);
        skills.forEach(skill => {
          expect(allSkills.has(skill))
            .toBeFalse(); // No skill should appear in multiple abilities
          allSkills.add(skill);
        });
      });
      
      expect(allSkills.size).toBe(12); // Total expected skills
    });

    test('should maintain consistent skill naming conventions', () => {
      const skillAbilities = AvantActorData.getSkillAbilities();
      const skillNames = Object.keys(skillAbilities);
      
      // All skill names should be lowercase strings
      skillNames.forEach(skill => {
        expect(skill).toBeString();
        expect(skill).toBe(skill.toLowerCase());
        expect(skill).not.toBeEmpty();
      });
    });

    test('should maintain consistent ability naming conventions', () => {
      const skillAbilities = AvantActorData.getSkillAbilities();
      const abilityNames = [...new Set(Object.values(skillAbilities))];
      
      expect(abilityNames).toIncludeAllMembers(['might', 'grace', 'intellect', 'focus']);
      expect(abilityNames).toHaveLength(4);
      
      // All ability names should be lowercase strings
      abilityNames.forEach(ability => {
        expect(ability).toBeString();
        expect(ability).toBe(ability.toLowerCase());
        expect(ability).not.toBeEmpty();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty string inputs gracefully', () => {
      expect(() => {
        AvantActorData.getSkillAbility('');
        AvantActorData.getAbilitySkills('');
      }).not.toThrow();
    });

    test('should handle whitespace inputs gracefully', () => {
      expect(AvantActorData.getSkillAbility('  ')).toBeNull();
      expect(AvantActorData.getAbilitySkills('  ')).toBeEmpty();
    });

    test('should handle numeric inputs gracefully', () => {
      expect(AvantActorData.getSkillAbility(123)).toBeNull();
      expect(AvantActorData.getAbilitySkills(456)).toBeEmpty();
    });

    test('should handle object inputs gracefully', () => {
      expect(AvantActorData.getSkillAbility({})).toBeNull();
      expect(AvantActorData.getAbilitySkills({})).toBeEmpty();
    });

    test('should maintain performance with repeated calls', () => {
      const startTime = Date.now();
      
      // Run methods many times
      for (let i = 0; i < 1000; i++) {
        AvantActorData.getSkillAbilities();
        AvantActorData.getSkillAbility('force');
        AvantActorData.getAbilitySkills('might');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
}); 