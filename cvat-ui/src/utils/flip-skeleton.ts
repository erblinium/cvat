import { ObjectState, ShapeType } from 'cvat-core-wrapper';

export default function flipSkeletonState(objectState: ObjectState): boolean {
    const state = objectState;
    if (state.shapeType !== ShapeType.SKELETON || state.elements.length < 2) {
        return false;
    }

    const elementPoints = state.elements.map((element: ObjectState) => (
        [...element.points as number[]]
    ));
    for (let index = 0; index + 1 < elementPoints.length; index += 2) {
        const firstElement = state.elements[index];
        const secondElement = state.elements[index + 1];

        if (firstElement.outside !== secondElement.outside) {
            [firstElement.outside, secondElement.outside] = [secondElement.outside, firstElement.outside];
        }
        if (firstElement.occluded !== secondElement.occluded) {
            [firstElement.occluded, secondElement.occluded] = [secondElement.occluded, firstElement.occluded];
        }

        [elementPoints[index], elementPoints[index + 1]] = [elementPoints[index + 1], elementPoints[index]];
    }

    state.points = elementPoints.flat();
    return true;
}
