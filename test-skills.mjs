// Test script to verify hub skills loading
import { E_COMMERCE_BUILTIN_SKILLS } from './packages/app/src/app/data/ecommerce-skills.ts';

console.log('E-commerce builtin skills:');
E_COMMERCE_BUILTIN_SKILLS.forEach(skill => {
  console.log(`- ${skill.name}: ${skill.description}`);
});

console.log(`\nTotal skills: ${E_COMMERCE_BUILTIN_SKILLS.length}`);