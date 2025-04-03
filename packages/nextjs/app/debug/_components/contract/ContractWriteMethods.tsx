import { Abi, AbiFunction } from "abitype";
import { WriteOnlyFunctionForm } from "~~/app/debug/_components/contract";
import { Contract, ContractName, GenericContract, InheritedFunctions } from "~~/utils/scaffold-eth/contract";

export const ContractWriteMethods = ({
  onChange,
  deployedContractData,
}: {
  onChange: () => void;
  deployedContractData: Contract<ContractName>;
}) => {
  if (!deployedContractData) {
    return null;
  }

  const functionsToDisplay = (
    (deployedContractData.abi as Abi).filter(part => part.type === "function") as AbiFunction[]
  )
    .filter(fn => {
      const isWriteableFunction = fn.stateMutability !== "view" && fn.stateMutability !== "pure";
      return isWriteableFunction;
    })
    .map(fn => {
      return {
        fn,
        inheritedFrom: ((deployedContractData as GenericContract)?.inheritedFunctions as InheritedFunctions)?.[fn.name],
      };
    })
    .sort((a, b) => (b.inheritedFrom ? b.inheritedFrom.localeCompare(a.inheritedFrom) : 1));

  if (!functionsToDisplay.length) {
    return <>No write methods</>;
  }

  return (
    <>
      {functionsToDisplay.map(({ fn, inheritedFrom }, idx) => (
        <WriteOnlyFunctionForm
          abi={deployedContractData.abi as Abi}
          key={`${fn.name}-${idx}}`}
          abiFunction={fn}
          onChange={onChange}
          contractAddress={deployedContractData.address}
          inheritedFrom={inheritedFrom}
        />
      ))}
    </>
  );
};
//=============================================================================================
// import { Abi, AbiFunction } from "abitype";
// import { WriteOnlyFunctionForm } from "~~/app/debug/_components/contract";
// import { Contract, ContractName, GenericContract, InheritedFunctions } from "~~/utils/scaffold-eth/contract";

// // 类型保护函数，用于检查 ABI 函数是否有 name 属性
// const hasNameProperty = (obj: any): obj is { name: string } => {
//   return typeof obj.name === 'string';
// };

// export const ContractWriteMethods = ({
//   onChange,
//   deployedContractData,
// }: {
//   onChange: () => void;
//   deployedContractData: Contract<ContractName>;
// }) => {
//   if (!deployedContractData) {
//     return null;
//   }

//   // Filter out functions that can modify the state (non-view and non-pure functions)
//   const functionsToDisplay = (
//     (deployedContractData.abi as Abi).filter(part => part.type === "function") as AbiFunction[]
//   )
//     .filter(fn => {
//       const isWriteableFunction = fn.stateMutability !== "view" && fn.stateMutability !== "pure";
//       return isWriteableFunction && hasNameProperty(fn); // 确保函数有 name 属性
//     })
//     .map(fn => {
//       return {
//         fn,
//         inheritedFrom: ((deployedContractData as GenericContract)?.inheritedFunctions as InheritedFunctions)?.[fn.name],
//       };
//     })
//     .sort((a, b) => (b.inheritedFrom ? b.inheritedFrom.localeCompare(a.inheritedFrom) : 1));

//   if (!functionsToDisplay.length) {
//     return <>No write methods</>;
//   }

//   return (
//     <>
//       {functionsToDisplay.map(({ fn, inheritedFrom }, idx) => (
//         <WriteOnlyFunctionForm
//           abi={deployedContractData.abi as Abi}
//           key={`${fn.name}-${idx}`} // Fixed typo in key prop
//           abiFunction={fn}
//           onChange={onChange}
//           contractAddress={deployedContractData.address}
//           inheritedFrom={inheritedFrom}
//         />
//       ))}
      
//       {/* 特别展示版税相关的方法 */}
//       <div className="royalty-methods">
//         <h3>Royalty-related Methods</h3>
//         {['setRoyaltyPercentage', 'purchase'].map(methodName => {
//           const method = deployedContractData.abi.find(
//             (fn: any) => fn.type === 'function' && hasNameProperty(fn) && fn.name === methodName
//           ) as AbiFunction | undefined;

//           if (method) {
//             return (
//               <WriteOnlyFunctionForm
//                 key={methodName}
//                 abi={deployedContractData.abi as Abi}
//                 abiFunction={method}
//                 onChange={onChange}
//                 contractAddress={deployedContractData.address}
//                 inheritedFrom={undefined} // 或者根据实际情况填写
//               />
//             );
//           }
//           return null;
//         })}
//       </div>
//     </>
//   );
// };