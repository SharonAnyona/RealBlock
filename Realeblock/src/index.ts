import { query, update, Record as AzleRecord, match, StableBTreeMap, Vec, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Land = AzleRecord<{
    landId: string;
    location: string;
    owner: string;
    uniqueIdentifier: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

type LandPayload = {
    location: string;
    owner: string;
    uniqueIdentifier: string;
};

type Transaction = AzleRecord<{
    transactionId: string;
    landId: string;
    fromOwner: string;
    toOwner: string;
    createdAt: nat64;
}>;

const landStorage = new StableBTreeMap<string, Land>(0, 44, 1024);
const transactionStorage = new StableBTreeMap<string, Transaction>(0, 44, 1024);

query;
export function getLands(): Result<Vec<Land>, string> {
    return Result.Ok(landStorage.values());
}

query;
export function getLand(landId: string): Result<Land, string> {
    return match(landStorage.get(landId), {
        Some: (land) => Result.Ok<Land, string>(land),
        None: () => Result.Err<Land, string>(`Land with id=${landId} not found`)
    });
}

$query;
export function getTransactions(): Result<Vec<Transaction>, string> {
    return Result.Ok(transactionStorage.values());
}

$update;
export function addLand(payload: LandPayload): Result<Land, string> {
    const land: Land = { landId: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    landStorage.insert(land.landId, land);
    return Result.Ok(land);
}

update;
export function updateLand(landId: string, payload: LandPayload): Result<Land, string> {
    return match(landStorage.get(landId), {
        Some: (land) => {
            const updatedLand: Land = { ...land, ...payload, updatedAt: Opt.Some(ic.time()) };
            landStorage.insert(land.landId, updatedLand);
            return Result.Ok<Land, string>(updatedLand);
        },
        None: () => Result.Err<Land, string>(`Couldn't update land with id=${landId}. Land not found`)
    });
}

$update;
export function deleteLand(landId: string): Result<Land, string> {
    return match(landStorage.remove(landId), {
        Some: (deletedLand) => Result.Ok<Land, string>(deletedLand),
        None: () => Result.Err<Land, string>(`Couldn't delete land with id=${landId}. Land not found.`)
    });
}

$update;
export function transferLand(landId: string, toOwner: string): Result<Land, string> {
    return match(landStorage.get(landId), {
        Some: (land) => {
            const transaction: Transaction = {
                transactionId: uuidv4(),
                landId,
                fromOwner: land.owner,
                toOwner,
                createdAt: ic.time()
            };

            const updatedLand: Land = { ...land, owner: toOwner, updatedAt: Opt.Some(ic.time()) };

            landStorage.insert(land.landId, updatedLand);
            transactionStorage.insert(transaction.transactionId, transaction);

            return Result.Ok<Land, string>(updatedLand);
        },
        None: () => Result.Err<Land, string>(`Couldn't transfer land with id=${landId}. Land not found`)
    });
}

// Workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};
