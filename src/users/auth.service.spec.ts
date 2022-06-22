// import { Test } from '@nestjs/testing';
// import { AuthService } from './auth.service';
// import { User } from './user.entity';
// import { UsersService } from './users.service';

// describe('AuthService', () => {
//   let service: AuthService;
//   let fakeUsersService: Partial<UsersService>;

//   beforeEach(async () => {
//     //Create a fake copy of the users service
//     const fakeUsersService = {
//       find: () => Promise.resolve([]),
//       create: (email: string, password: string) =>
//         Promise.resolve({ id: 1, email, password } as User),
//     };
//     const module = await Test.createTestingModule({
//       providers: [
//         AuthService,
//         {
//           provide: UsersService,
//           useValue: fakeUsersService,
//         },
//       ],
//     }).compile();

//     service = module.get(AuthService);
//   });

//   it('can create an instance of auth service', async () => {
//     expect(service).toBeDefined();
//   });

//   it('creates a new user with a salted and hashed password', async () => {
//     const user = await service.signup('asd@asd.com', 'asdasd');
//     expect(user.password).not.toEqual('asdasd');
//     const [salt, hash] = user.password.split('.');
//     expect(salt).toBeDefined();
//     expect(hash).toBeDefined();
//   });

//   it('throws an error if user signs up with an email in use', (done) => {
//     fakeUsersService.find = () =>
//       Promise.resolve([
//         { id: 1, email: 'asd@asd.com', password: 'asd' } as User,
//       ]);
//     service.signup('asd@asd.com', 'asdasd').catch((e) => console.log(e));
//   });
// });

import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asdf@asdf.com', 'asdf');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('asd@asd.com', 'asdasd');

    try {
      await service.signup('asd@asd.com', 'asdasd');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toBe('email alrefady in use');
    }
  });

  it('throws if signin is called with an unused email', (done) => {
    service.signin('asd@asd.com', 'asdasd').catch((e) => done());
  });

  it('throws if an invalid password is provided', (done) => {
    service.signup('asd@asd.com', 'asdasd').then((result) => {
      service.signin('asd@asd.com', 'asdasd2').catch((e) => done());
    });
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('asd@asd.com', 'asdasd');
    const user = await service.signin('asd@asd.com', 'asdasd');
    expect(user).toBeDefined();
  });
});
