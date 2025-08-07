/**
 * @fileoverview Unit Tests for AvantActorData
 * @version 2.0.0
 * @author Avant Development Team  
 * @description Comprehensive tests for actor data model functionality
 */

import { AvantActorData } from '../../scripts/data/actor-data.js';

describe('AvantActorData', () => {
  describe('Static Methods', () => {
    describe('getSkillAttributes', () => {
      test('should return complete skill-to-attribute mapping', () => {
        const skillAttributes = AvantActorData.getSkillAttributes();
        
        expect(skillAttributes)
          .toBeObject()
          .toContainAllKeys([
            'debate', 'discern', 'endure', 'finesse', 'force',
            'command', 'charm', 'hide', 'inspect', 'intuit', 'recall', 'surge'
          ]);
      });

      test('should map skills to correct attributes', () => {
        const skillAttributes = AvantActorData.getSkillAttributes();
        
        // Might-based skills
        expect(skillAttributes.force).toBe('might');
        expect(skillAttributes.command).toBe('might');
        expect(skillAttributes.surge).toBe('might');
        
        // Grace-based skills
        expect(skillAttributes.finesse).toBe('grace');
        expect(skillAttributes.hide).toBe('grace');
        expect(skillAttributes.charm).toBe('grace');
        
        // Intellect-based skills
        expect(skillAttributes.debate).toBe('intellect');
        expect(skillAttributes.inspect).toBe('intellect');
        expect(skillAttributes.recall).toBe('intellect');
        
        // Focus-based skills
        expect(skillAttributes.discern).toBe('focus');
        expect(skillAttributes.endure).toBe('focus');
        expect(skillAttributes.intuit).toBe('focus');
      });

      test('should return consistent mapping on multiple calls', () => {
        const mapping1 = AvantActorData.getSkillAttributes();
        const mapping2 = AvantActorData.getSkillAttributes();
        
        expect(mapping1).toEqual(mapping2);
      });

      test('should contain exactly 12 skill mappings', () => {
        const skillAttributes = AvantActorData.getSkillAttributes();
        
        expect(Object.keys(skillAttributes)).toHaveLength(12);
      });
    });

    describe('getSkillAttribute', () => {
      test('should return correct attribute for valid skill names', () => {
        expect(AvantActorData.getSkillAttribute('force')).toBe('might');
        expect(AvantActorData.getSkillAttribute('finesse')).toBe('grace');
        expect(AvantActorData.getSkillAttribute('recall')).toBe('intellect');
        expect(AvantActorData.getSkillAttribute('discern')).toBe('focus');
      });

      test('should return null for invalid skill names', () => {
        expect(AvantActorData.getSkillAttribute('invalidSkill')).toBeNull();
        expect(AvantActorData.getSkillAttribute('nonexistent')).toBeNull();
        expect(AvantActorData.getSkillAttribute('')).toBeNull();
      });

      test('should handle case sensitivity correctly', () => {
        expect(AvantActorData.getSkillAttribute('Force')).toBeNull();
        expect(AvantActorData.getSkillAttribute('FORCE')).toBeNull();
        expect(AvantActorData.getSkillAttribute('force')).toBe('might');
      });

      test('should handle null and undefined inputs', () => {
        expect(AvantActorData.getSkillAttribute(null)).toBeNull();
        expect(AvantActorData.getSkillAttribute(undefined)).toBeNull();
      });

      test('should work with all defined skills', () => {
        const skillAttributes = AvantActorData.getSkillAttributes();
        
        for (const [skill, expectedAttribute] of Object.entries(skillAttributes)) {
          expect(AvantActorData.getSkillAttribute(skill))
            .toBe(expectedAttribute);
        }
      });
    });

    describe('getAttributeSkills', () => {
      test('should return correct skills for might attribute', () => {
        const mightSkills = AvantActorData.getAttributeSkills('might');
        
        expect(mightSkills)
          .toBeArray()
          .toIncludeAllMembers(['command', 'force', 'surge'])
          .toHaveLength(3);
      });

      test('should return correct skills for grace attribute', () => {
        const graceSkills = AvantActorData.getAttributeSkills('grace');
        
        expect(graceSkills)
          .toBeArray()
          .toIncludeAllMembers(['charm', 'finesse', 'hide'])
          .toHaveLength(3);
      });

      test('should return correct skills for intellect attribute', () => {
        const intellectSkills = AvantActorData.getAttributeSkills('intellect');
        
        expect(intellectSkills)
          .toBeArray()
          .toIncludeAllMembers(['debate', 'inspect', 'recall'])
          .toHaveLength(3);
      });

      test('should return correct skills for focus attribute', () => {
        const focusSkills = AvantActorData.getAttributeSkills('focus');
        
        expect(focusSkills)
          .toBeArray()
          .toIncludeAllMembers(['discern', 'endure', 'intuit'])
          .toHaveLength(3);
      });

      test('should return empty array for invalid attribute names', () => {
        expect(AvantActorData.getAttributeSkills('invalid'))
          .toBeArray()
          .toBeEmpty();
        
        expect(AvantActorData.getAttributeSkills('nonexistent'))
          .toBeArray()
          .toBeEmpty();
        
        expect(AvantActorData.getAttributeSkills(''))
          .toBeArray()
          .toBeEmpty();
      });

      test('should return sorted skill arrays', () => {
        const mightSkills = AvantActorData.getAttributeSkills('might');
        const sortedMightSkills = [...mightSkills].sort();
        
        expect(mightSkills).toEqual(sortedMightSkills);
        
        const intellectSkills = AvantActorData.getAttributeSkills('intellect');
        const sortedIntellectSkills = [...intellectSkills].sort();
        
        expect(intellectSkills).toEqual(sortedIntellectSkills);
      });

      test('should handle case sensitivity correctly', () => {
        expect(AvantActorData.getAttributeSkills('Might')).toBeEmpty();
        expect(AvantActorData.getAttributeSkills('MIGHT')).toBeEmpty();
        expect(AvantActorData.getAttributeSkills('might')).not.toBeEmpty();
      });

      test('should handle null and undefined inputs', () => {
        expect(AvantActorData.getAttributeSkills(null)).toBeEmpty();
        expect(AvantActorData.getAttributeSkills(undefined)).toBeEmpty();
      });

      test('should ensure all skills are accounted for', () => {
        const allAttributes = ['might', 'grace', 'intellect', 'focus'];
        const allSkillsFromAttributes = [];
        
        allAttributes.forEach(attribute => {
          const skills = AvantActorData.getAttributeSkills(attribute);
          allSkillsFromAttributes.push(...skills);
        });
        
        const allSkillsFromMapping = Object.keys(AvantActorData.getSkillAttributes());
        
        expect(allSkillsFromAttributes.sort()).toEqual(allSkillsFromMapping.sort());
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

      test('should include attributes structure', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema)
          .toContainKey('attributes');
        
        expect(schema.attributes.fields).toContainKeys([
          'might', 'grace', 'intellect', 'focus'
        ]);
      });

      test('should include skills structure', () => {
        const schema = AvantActorData.defineSchema();
        
        expect(schema)
          .toContainKey('skills');
        
        const skillAttributes = AvantActorData.getSkillAttributes();
        const expectedSkills = Object.keys(skillAttributes);
        
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
    test('should validate skill-attribute relationships are bidirectional', () => {
      const skillAttributes = AvantActorData.getSkillAttributes();
      
      for (const [skill, attribute] of Object.entries(skillAttributes)) {
        const attributeSkills = AvantActorData.getAttributeSkills(attribute);
        
        expect(attributeSkills)
          .toContain(skill);
      }
    });

    test('should ensure no duplicate skills across attributes', () => {
      const allAttributes = ['might', 'grace', 'intellect', 'focus'];
      const allSkills = new Set();
      
      allAttributes.forEach(attribute => {
        const skills = AvantActorData.getAttributeSkills(attribute);
        skills.forEach(skill => {
          expect(allSkills.has(skill))
            .toBeFalse(); // No skill should appear in multiple attributes
          allSkills.add(skill);
        });
      });
      
      expect(allSkills.size).toBe(12); // Total expected skills
    });

    test('should maintain consistent skill naming conventions', () => {
      const skillAttributes = AvantActorData.getSkillAttributes();
      const skillNames = Object.keys(skillAttributes);
      
      // All skill names should be lowercase strings
      skillNames.forEach(skill => {
        expect(skill).toBeString();
        expect(skill).toBe(skill.toLowerCase());
        expect(skill).not.toBeEmpty();
      });
    });

    test('should maintain consistent attribute naming conventions', () => {
      const skillAttributes = AvantActorData.getSkillAttributes();
      const attributeNames = [...new Set(Object.values(skillAttributes))];
      
      expect(attributeNames).toIncludeAllMembers(['might', 'grace', 'intellect', 'focus']);
      expect(attributeNames).toHaveLength(4);
      
      // All attribute names should be lowercase strings
      attributeNames.forEach(attribute => {
        expect(attribute).toBeString();
        expect(attribute).toBe(attribute.toLowerCase());
        expect(attribute).not.toBeEmpty();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty string inputs gracefully', () => {
      expect(() => {
        AvantActorData.getSkillAttribute('');
        AvantActorData.getAttributeSkills('');
      }).not.toThrow();
    });

    test('should handle whitespace inputs gracefully', () => {
      expect(AvantActorData.getSkillAttribute('  ')).toBeNull();
      expect(AvantActorData.getAttributeSkills('  ')).toBeEmpty();
    });

    test('should handle numeric inputs gracefully', () => {
      expect(AvantActorData.getSkillAttribute(123)).toBeNull();
      expect(AvantActorData.getAttributeSkills(456)).toBeEmpty();
    });

    test('should handle object inputs gracefully', () => {
      expect(AvantActorData.getSkillAttribute({})).toBeNull();
      expect(AvantActorData.getAttributeSkills({})).toBeEmpty();
    });

    test('should maintain performance with repeated calls', () => {
      const startTime = Date.now();
      
      // Run methods many times
      for (let i = 0; i < 1000; i++) {
        AvantActorData.getSkillAttributes();
        AvantActorData.getSkillAttribute('force');
        AvantActorData.getAttributeSkills('might');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
}); 