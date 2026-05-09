/**
 * Manual Socket.IO Test Script
 * Tests state recovery and Hangman role assignment
 */

import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const BACKEND_URL = 'http://localhost:3000';

// Create test tokens
const user1Token = jwt.sign(
  { userId: 'test-user-1', username: 'testuser1' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const user2Token = jwt.sign(
  { userId: 'test-user-2', username: 'testuser2' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('🧪 Starting Manual Socket.IO Tests\n');

// Test 1: State Recovery
async function testStateRecovery() {
  console.log('📋 Test 1: State Recovery');
  
  return new Promise((resolve) => {
    const socket = io(BACKEND_URL, {
      auth: { token: user1Token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to backend');
    });

    socket.on('authenticated', (data) => {
      console.log('✅ Authenticated:', data);
      
      // Request state for a test room (you'll need to create one first)
      socket.emit('room:get_state', { roomId: 'test-room-id' }, (response) => {
        if (response.error) {
          console.log('⚠️  Expected error (room not found or not a member):', response.error);
        } else {
          console.log('✅ State recovery response:', {
            room: response.room,
            membersCount: response.members.length,
            messagesCount: response.messages.length,
            hasActiveGame: !!response.activeGame,
            userRole: response.userRole
          });
        }
        
        socket.disconnect();
        resolve();
      });
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error.message);
      resolve();
    });
  });
}

// Test 2: Hangman Role Assignment (requires a room with 2 members)
async function testHangmanRoles() {
  console.log('\n📋 Test 2: Hangman Role Assignment');
  console.log('⚠️  This test requires:');
  console.log('   - A room created by test-user-1');
  console.log('   - test-user-2 joined as a member');
  console.log('   - No active game in the room');
  console.log('   - You can test this manually through the frontend\n');
  
  return new Promise((resolve) => {
    const socket = io(BACKEND_URL, {
      auth: { token: user1Token },
      transports: ['websocket']
    });

    socket.on('authenticated', (data) => {
      console.log('✅ Authenticated:', data);
      console.log('ℹ️  To test Hangman roles:');
      console.log('   1. Create a room through the frontend');
      console.log('   2. Have another user join');
      console.log('   3. Start a Hangman game');
      console.log('   4. Check the game:started event for role assignments');
      
      socket.disconnect();
      resolve();
    });
  });
}

// Run tests
(async () => {
  try {
    await testStateRecovery();
    await testHangmanRoles();
    
    console.log('\n✅ Manual tests completed');
    console.log('📝 For full verification:');
    console.log('   1. Use the frontend to create rooms and start games');
    console.log('   2. Test state recovery by refreshing the page during a game');
    console.log('   3. Test Hangman roles by starting a Hangman game and verifying:');
    console.log('      - Player 1 is assigned as Word Setter');
    console.log('      - Player 2 is assigned as Word Guesser');
    console.log('      - Only the Guesser can guess letters');
    console.log('      - Appropriate error messages for role violations');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
})();
