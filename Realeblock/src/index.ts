import { $query, $update, Record, match, StableBTreeMap, Vec, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define the structure of a land record
type Land = Record<{
  landId: string;
  location: string;
  owner: string;
  uniqueIdentifier: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the payload structure for adding or updating a land
type LandPayload = Record<{
  location: string;
  owner: string;
  uniqueIdentifier: string;
}>;

// Define the structure of a transaction record
type Transaction = Record<{
  transactionId: string;
  landId: string;
  fromOwner: string;
  toOwner: string;
  createdAt: nat64;
}>;

// Create storage maps for lands and transactions
const landStorage = new StableBTreeMap<string, Land>(0, 44, 1024);
const transactionStorage = new StableBTreeMap<string, Transaction>(1, 44, 1024);

// Query to get all lands
$query;
export function getLands(): Result<Vec<Land>, string> {
  try {
    return Result.Ok(landStorage.values());
  } catch (error) {
    return Result.Err('Error retrieving lands.');
  }
}

// Query to get a land by ID
$query;
export function getLand(landId: string): Result<Land, string> {
  // Validate ID
  if (!landId) {
    return Result.Err<Land, string>('Invalid ID for getting a land.');
  }

  try {
    return match(landStorage.get(landId), {
      Some: (land) => Result.Ok<Land, string>(land),
      None: () => Result.Err<Land, string>(`Land with id=${landId} not found`)
    });
  } catch (error) {
    return Result.Err('Error retrieving land by ID.');
  }
}

// Query to get all transactions
$query;
export function getTransactions(): Result<Vec<Transaction>, string> {
  try {
    return Result.Ok(transactionStorage.values());
  } catch (error) {
    return Result.Err('Error retrieving transactions.');
  }
}

// Update to add a new land
$update;
export function addLand(payload: LandPayload): Result<Land, string> {
  // Validate payload properties
  if (!payload.location || !payload.owner || !payload.uniqueIdentifier) {
    return Result.Err<Land, string>('Invalid payload properties for adding a land.');
  }

  try {
    // Create a new land record
    const land: Land = {
      landId: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      location: payload.location,
      owner: payload.owner,
      uniqueIdentifier: payload.uniqueIdentifier,
    };

    // Insert the new land into the storage map
    landStorage.insert(land.landId, land);

    // Return the result
    return Result.Ok(land);
  } catch (error) {
    // Return an error result with a meaningful message
    return Result.Err<Land, string>('Error adding a land.');
  }
}

// Update to update an existing land
$update;
export function updateLand(landId: string, payload: LandPayload): Result<Land, string> {
  // Validate ID and payload properties
  if (!landId || !payload.location || !payload.owner || !payload.uniqueIdentifier) {
    return Result.Err<Land, string>('Invalid ID or payload properties for updating a land.');
  }

  try {
    return match(landStorage.get(landId), {
      Some: (land) => {
        // Create an updated land record
        const updatedLand: Land = {
          landId: land.landId,
          createdAt: land.createdAt,
          updatedAt: Opt.Some(ic.time()),
          location: payload.location,
          owner: payload.owner,
          uniqueIdentifier: payload.uniqueIdentifier,
        };

        // Insert the updated land into the storage map
        landStorage.insert(updatedLand.landId, updatedLand);

        // Return the result
        return Result.Ok<Land, string>(updatedLand);
      },
      None: () => Result.Err<Land, string>(`Couldn't update land with id=${landId}. Land not found`)
    });
  } catch (error) {
    // Return an error result with a meaningful message
    return Result.Err<Land, string>('Error updating land.');
  }
}

// Update to delete a land by ID
$update;
export function deleteLand(landId: string): Result<Land, string> {
  // Validate ID
  if (!landId) {
    return Result.Err<Land, string>('Invalid ID for deleting a land.');
  }

  try {
    return match(landStorage.remove(landId), {
      Some: (deletedLand) => Result.Ok<Land, string>(deletedLand),
      None: () => Result.Err<Land, string>(`Couldn't delete land with id=${landId}. Land not found.`)
    });
  } catch (error) {
    // Return an error result with a meaningful message
    return Result.Err<Land, string>('Error deleting land.');
  }
}

// Update to transfer a land to a new owner
$update;
export function transferLand(landId: string, toOwner: string): Result<Land, string> {
  // Validate ID
  if (!landId) {
    return Result.Err<Land, string>('Invalid ID for transferring a land.');
  }

  try {
    return match(landStorage.get(landId), {
      Some: (land) => {
        // Create a transaction record
        const transaction: Transaction = {
          transactionId: uuidv4(),
          landId: land.landId,
          fromOwner: land.owner,
          toOwner,
          createdAt: ic.time(),
        };

        // Create an updated land record with the new owner
        const updatedLand: Land = {
          landId: land.landId,
          createdAt: land.createdAt,
          updatedAt: Opt.Some(ic.time()),
          location: land.location,
          owner: toOwner,
          uniqueIdentifier: land.uniqueIdentifier,
        };

        // Insert the updated land into the storage map
        landStorage.insert(land.landId, updatedLand);

        // Insert the transaction into the transaction storage map
        transactionStorage.insert(transaction.transactionId, transaction);

        // Return the result
        return Result.Ok<Land, string>(updatedLand);
      },
      None: () => Result.Err<Land, string>(`Couldn't transfer land with id=${landId}. Land not found`)
    });
  } catch (error) {
    // Return an error result with a meaningful message
    return Result.Err<Land, string>('Error transferring land.');
  }
}

// Set up a random number generator for generating UUIDs
globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
