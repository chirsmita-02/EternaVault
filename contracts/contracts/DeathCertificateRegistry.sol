// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DeathCertificateRegistry is Ownable {
    enum Role { None, GovernmentRegistrar, InsuranceCompany }

    struct CertificateRecord {
        bytes32 certHash;            // SHA-256 hash of the certificate details/file
        string ipfsCid;              // IPFS CID of the certificate document
        address registrar;           // government registrar wallet who uploaded
        uint256 timestamp;           // block timestamp when recorded
    }

    // role management
    mapping(address => Role) public roles;
    // certificate hash => record
    mapping(bytes32 => CertificateRecord) private records;

    event AuthorityUpdated(address indexed authority, Role role);
    event CertificateAdded(bytes32 indexed certHash, string ipfsCid, address indexed registrar);

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyRegistrar() {
        require(roles[msg.sender] == Role.GovernmentRegistrar, "Not registrar");
        _;
    }

    function addAuthority(address authority, Role role) external onlyOwner {
        require(authority != address(0), "zero addr");
        roles[authority] = role;
        emit AuthorityUpdated(authority, role);
    }

    // WARNING: This allows any address to self-assign registrar role.
    // The product requirement is to treat a MetaMask connection as sufficient
    // proof of being a registrar, so we implement self-registration here.
    function selfRegisterRegistrar() external {
        roles[msg.sender] = Role.GovernmentRegistrar;
        emit AuthorityUpdated(msg.sender, Role.GovernmentRegistrar);
    }

    function removeAuthority(address authority) external onlyOwner {
        roles[authority] = Role.None;
        emit AuthorityUpdated(authority, Role.None);
    }

    function addCertificate(bytes32 certHash, string calldata ipfsCid) external onlyRegistrar {
        require(certHash != bytes32(0), "empty hash");
        require(bytes(ipfsCid).length > 0, "empty cid");
        require(records[certHash].timestamp == 0, "exists");

        records[certHash] = CertificateRecord({
            certHash: certHash,
            ipfsCid: ipfsCid,
            registrar: msg.sender,
            timestamp: block.timestamp
        });

        emit CertificateAdded(certHash, ipfsCid, msg.sender);
    }

    function verifyCertificate(bytes32 certHash) external view returns (bool exists, string memory ipfsCid, address registrar, uint256 timestamp) {
        CertificateRecord memory rec = records[certHash];
        if (rec.timestamp == 0) {
            return (false, "", address(0), 0);
        }
        return (true, rec.ipfsCid, rec.registrar, rec.timestamp);
    }
}


