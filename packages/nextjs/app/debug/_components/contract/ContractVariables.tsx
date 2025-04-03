import { DisplayVariable } from "./DisplayVariable";
import { Abi, AbiFunction } from "abitype";
import { Contract, ContractName, GenericContract, InheritedFunctions } from "~~/utils/scaffold-eth/contract";

export const ContractVariables = ({
  refreshDisplayVariables,
  deployedContractData,
}: {
  refreshDisplayVariables: boolean;
  deployedContractData: Contract<ContractName>;
}) => {
  if (!deployedContractData) {
    return null;
  }

  const functionsToDisplay = (
    (deployedContractData.abi as Abi).filter(part => part.type === "function") as AbiFunction[]
  )
    .filter(fn => {
      const isQueryableWithNoParams =
        (fn.stateMutability === "view" || fn.stateMutability === "pure") && fn.inputs.length === 0;
      return isQueryableWithNoParams;
    })
    .map(fn => {
      return {
        fn,
        inheritedFrom: ((deployedContractData as GenericContract)?.inheritedFunctions as InheritedFunctions)?.[fn.name],
      };
    })
    .sort((a, b) => (b.inheritedFrom ? b.inheritedFrom.localeCompare(a.inheritedFrom) : 1));

  if (!functionsToDisplay.length) {
    return <>No contract variables</>;
  }

  return (
    <>
      {functionsToDisplay.map(({ fn, inheritedFrom }) => (
        <DisplayVariable
          abi={deployedContractData.abi as Abi}
          abiFunction={fn}
          contractAddress={deployedContractData.address}
          key={fn.name}
          refreshDisplayVariables={refreshDisplayVariables}
          inheritedFrom={inheritedFrom}
        />
      ))}
    </>
  );
};
//==============================================================
// import { DisplayVariable } from "./DisplayVariable";
// import { Abi, AbiFunction } from "abitype";
// import { Contract, ContractName, GenericContract, InheritedFunctions } from "~~/utils/scaffold-eth/contract";

// export const ContractVariables = ({
//   refreshDisplayVariables,
//   deployedContractData,
// }: {
//   refreshDisplayVariables: boolean;
//   deployedContractData: Contract<ContractName>;
// }) => {
//   if (!deployedContractData) {
//     return null;
//   }

//   // Filter out view and pure functions that we want to display.
//   const functionsToDisplay = (
//     (deployedContractData.abi as Abi).filter(part => part.type === "function") as AbiFunction[]
//   )
//     .filter(fn => {
//       // Allow view/pure functions with or without parameters for more flexibility
//       const isQueryable =
//         fn.stateMutability === "view" || fn.stateMutability === "pure";
//       return isQueryable;
//     })
//     .map(fn => {
//       return {
//         fn,
//         inheritedFrom: ((deployedContractData as GenericContract)?.inheritedFunctions as InheritedFunctions)?.[fn.name],
//       };
//     })
//     .sort((a, b) => (b.inheritedFrom ? b.inheritedFrom.localeCompare(a.inheritedFrom) : 1));

//   if (!functionsToDisplay.length) {
//     return <>No contract variables</>;
//   }

//   return (
//     <>
//       {functionsToDisplay.map(({ fn, inheritedFrom }) => (
//         <DisplayVariable
//           abi={deployedContractData.abi as Abi}
//           abiFunction={fn}
//           contractAddress={deployedContractData.address}
//           key={fn.name}
//           refreshDisplayVariables={refreshDisplayVariables}
//           inheritedFrom={inheritedFrom}
//         />
//       ))}
//     </>
//   );
// };