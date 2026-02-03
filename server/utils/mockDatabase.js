// server/utils/mockDatabase.js
class MockBusModel {
  constructor() {
    this.buses = [];
    this.currentId = 1;
  }

  find(filter = {}) {
    let result = [...this.buses];
    
    if (filter.busNumber) {
      result = result.filter(bus => bus.bus_number === filter.busNumber);
    }
    
    if (filter.status) {
      result = result.filter(bus => bus.status === filter.status);
    }
    
    return result;
  }

  findById(id) {
    return this.buses.find(bus => bus.id === parseInt(id)) || null;
  }

  findOne(filter = {}) {
    const buses = this.find(filter);
    return buses.length > 0 ? buses[0] : null;
  }

  create(busData) {
    const newBus = {
      id: this.currentId++,
      ...busData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.buses.push(newBus);
    return newBus;
  }

  findByIdAndUpdate(id, updateData) {
    const index = this.buses.findIndex(bus => bus.id === parseInt(id));
    if (index === -1) return null;
    
    const updatedBus = {
      ...this.buses[index],
      ...updateData,
      updated_at: new Date()
    };
    this.buses[index] = updatedBus;
    return updatedBus;
  }

  findByIdAndDelete(id) {
    const index = this.buses.findIndex(bus => bus.id === parseInt(id));
    if (index === -1) return null;
    
    const deletedBus = this.buses[index];
    this.buses.splice(index, 1);
    return deletedBus;
  }
}

class MockUserModel {
  constructor() {
    this.users = [];
    this.currentId = 1;
  }

  find(filter = {}) {
    let result = [...this.users];
    
    if (filter.role) {
      result = result.filter(user => user.role === filter.role);
    }
    
    return result;
  }

  findById(id) {
    return this.users.find(user => user.id === parseInt(id)) || null;
  }

  findByEmail(email) {
    return this.users.find(user => user.email === email) || null;
  }

  create(userData) {
    const newUser = {
      id: this.currentId++,
      ...userData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  findByIdAndUpdate(id, updateData) {
    const index = this.users.findIndex(user => user.id === parseInt(id));
    if (index === -1) return null;
    
    const updatedUser = {
      ...this.users[index],
      ...updateData,
      updated_at: new Date()
    };
    this.users[index] = updatedUser;
    return updatedUser;
  }

  findByIdAndDelete(id) {
    const index = this.users.findIndex(user => user.id === parseInt(id));
    if (index === -1) return null;
    
    const deletedUser = this.users[index];
    this.users.splice(index, 1);
    return deletedUser;
  }
}

// Create instances
const mockBusModel = new MockBusModel();
const mockUserModel = new MockUserModel();

// Add some initial mock data
mockBusModel.create({
  bus_number: 'BUS-001',
  route_name: 'East Campus Route',
  driver_id: null,
  capacity: 40,
  latitude: 12.9716,
  longitude: 77.5946,
  speed: 0,
  status: 'active',
  route_stops: JSON.stringify(['Stop A', 'Stop B', 'Stop C']),
  route_description: 'Main east campus route'
});

mockBusModel.create({
  bus_number: 'BUS-002',
  route_name: 'West Campus Route',
  driver_id: null,
  capacity: 35,
  latitude: 12.9352,
  longitude: 77.6245,
  speed: 0,
  status: 'active',
  route_stops: JSON.stringify(['Stop X', 'Stop Y', 'Stop Z']),
  route_description: 'West campus shuttle'
});

module.exports = {
  mockBusModel,
  mockUserModel
};